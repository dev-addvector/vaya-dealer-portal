const fs = require('fs');
const path = require('path');
const prisma = require('../../config/database');

const UPLOAD_DIR = path.join(__dirname, '../../../uploads/ebrochures');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

exports.list = async (req, res) => {
  const records = await prisma.multiple_ebrochure_file.findMany({ orderBy: { created_at: 'desc' } });
  const data = records.map((r) => ({
    id: r.id,
    filename: r.ebrochure,
    name: r.ebrochure ? r.ebrochure.replace(/\.pdf$/i, '').replace(/-/g, ' ') : '',
    url: `/uploads/ebrochures/${encodeURIComponent(r.ebrochure)}`,
    createdAt: r.created_at,
  }));
  res.json({ success: true, data });
};

exports.upload = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const record = await prisma.multiple_ebrochure_file.create({ data: { ebrochure: req.file.filename } });
  res.json({
    success: true,
    data: {
      id: record.id,
      filename: record.ebrochure,
      name: record.ebrochure.replace(/\.pdf$/i, '').replace(/-/g, ' '),
      url: `/uploads/ebrochures/${encodeURIComponent(record.ebrochure)}`,
    },
  });
};

exports.remove = async (req, res) => {
  const id = Number(req.params.id);
  const record = await prisma.multiple_ebrochure_file.findUnique({ where: { id } });
  if (!record) return res.status(404).json({ success: false, message: 'Not found' });

  const filePath = path.join(UPLOAD_DIR, record.ebrochure);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await prisma.multiple_ebrochure_file.delete({ where: { id } });
  res.json({ success: true, message: 'Deleted' });
};
