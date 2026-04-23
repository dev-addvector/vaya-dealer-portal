const prisma = require('../../config/database');
const qrService = require('../../services/qr.service');
const { randomToken } = require('../../utils/helpers');

const toClient = (b) => ({
  id: b.id,
  title: b.title,
  brochureKey: b.brochure_key,
  fileName: b.file_name,
  qrCode: b.qr_code,
  patternName: b.pattern_name,
  isActive: b.is_active,
  createdAt: b.created_at,
});

exports.list = async (req, res) => {
  const brochures = await prisma.brochure.findMany({ orderBy: { created_at: 'desc' } });
  res.json({ success: true, data: brochures.map(toClient) });
};

exports.create = async (req, res) => {
  const { title, patternName } = req.body;
  const brochure_key = randomToken().slice(0, 16);
  const file_name = req.file?.filename || null;
  const qrData = `${process.env.APP_URL}/brochure/${brochure_key}`;
  const qrFile = await qrService.generateQr(qrData, brochure_key);
  const brochure = await prisma.brochure.create({
    data: { title, brochure_key, file_name, pattern_name: patternName, qr_code: qrFile },
  });
  res.json({ success: true, data: toClient(brochure) });
};

exports.update = async (req, res) => {
  const { title, patternName } = req.body;
  const data = { title, pattern_name: patternName };
  if (req.file) data.file_name = req.file.filename;
  await prisma.brochure.update({ where: { id: req.params.id }, data });
  res.json({ success: true, message: 'Brochure updated' });
};

exports.remove = async (req, res) => {
  await prisma.brochure.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Brochure deleted' });
};
