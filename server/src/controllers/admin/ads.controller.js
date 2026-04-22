const prisma = require('../../config/database');

exports.list = async (req, res) => {
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: ads });
};

exports.getActive = async (req, res) => {
  const now = new Date();
  const ad = await prisma.ad.findFirst({
    where: { startDate: { lte: now }, endDate: { gte: now } },
  });
  res.json({ success: true, data: ad });
};

exports.create = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const fileName = req.file?.filename || null;
  const ad = await prisma.ad.create({
    data: { title, startDate: new Date(startDate), endDate: new Date(endDate), fileName },
  });
  res.json({ success: true, data: ad });
};

exports.update = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const data = { title, startDate: new Date(startDate), endDate: new Date(endDate) };
  if (req.file) data.fileName = req.file.filename;
  await prisma.ad.update({ where: { id: Number(req.params.id) }, data });
  res.json({ success: true, message: 'Ad updated' });
};

exports.remove = async (req, res) => {
  await prisma.ad.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true, message: 'Ad deleted' });
};
