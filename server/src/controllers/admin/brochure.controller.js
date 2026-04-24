const prisma = require('../../config/database');
const qrService = require('../../services/qr.service');
const csvParser = require('csv-parser');
const fs = require('fs');

function toKey(patternName) {
  return patternName.toLowerCase().replace(/\s+/g, '-');
}

function parseCSVCollections(filePath) {
  return new Promise((resolve, reject) => {
    const collections = new Set();
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => {
        const col = row['Collection'] || row['collection'] || row['COLLECTION'];
        if (col && col.trim()) collections.add(col.trim());
      })
      .on('end', () => resolve([...collections]))
      .on('error', reject);
  });
}

const toClient = (b) => ({
  id: b.id,
  title: b.title,
  brochureKey: b.brochure_key,
  fileName: b.file_name,
  qrCode: b.qr_code,
  qrCode2: b.qr_code2,
  patternName: b.pattern_name,
  isActive: b.is_active,
  createdAt: b.created_at,
  updatedAt: b.updated_at,
});

exports.list = async (req, res) => {
  const brochures = await prisma.brochure.findMany({ orderBy: { pattern_name: 'asc' } });
  const latest = await prisma.brochure.findFirst({
    where: { file_name: { not: null }, is_active: true },
    orderBy: { updated_at: 'desc' },
  });
  res.json({
    success: true,
    data: brochures.map(toClient),
    latestFile: latest?.file_name || null,
    latestDate: latest?.updated_at || null,
  });
};

exports.uploadCSV = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'CSV file required' });

  const filePath = req.file.path;
  const fileName = req.file.filename;

  const patterns = await parseCSVCollections(filePath);
  if (patterns.length === 0) {
    return res.status(400).json({ success: false, message: 'No Collection values found in CSV' });
  }

  const uploadedKeys = new Set();

  for (const patternName of patterns) {
    if (!patternName) continue;
    const brochureKey = toKey(patternName);
    if (!brochureKey) continue;
    uploadedKeys.add(brochureKey);

    const existing = await prisma.brochure.findFirst({ where: { brochure_key: brochureKey } });
    if (existing) {
      await prisma.brochure.update({
        where: { id: existing.id },
        data: { file_name: fileName, is_active: true, updated_at: new Date() },
      });
    } else {
      const { qrFile, wopFile } = await qrService.generateQrPair(brochureKey);
      await prisma.brochure.create({
        data: {
          brochure_key: brochureKey,
          pattern_name: patternName,
          file_name: fileName,
          qr_code: qrFile,
          qr_code2: wopFile,
          is_active: true,
        },
      });
    }
  }

  const all = await prisma.brochure.findMany({ select: { id: true, brochure_key: true } });
  const toDeactivate = all.filter((b) => !uploadedKeys.has(b.brochure_key)).map((b) => b.id);
  if (toDeactivate.length > 0) {
    await prisma.brochure.updateMany({ where: { id: { in: toDeactivate } }, data: { is_active: false } });
  }

  res.json({ success: true, message: `CSV processed: ${patterns.length} patterns updated` });
};

exports.remove = async (req, res) => {
  await prisma.brochure.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Brochure deleted' });
};
