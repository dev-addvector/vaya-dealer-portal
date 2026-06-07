const prisma = require('../../config/database');

function toISTStart(dateStr) { return new Date(dateStr + 'T00:00:00+05:30'); }
function toISTEnd(dateStr)   { return new Date(dateStr + 'T23:59:59+05:30'); }

exports.list = async (req, res) => {
  const ads = await prisma.ad.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ success: true, data: ads });
};

exports.getActive = async (req, res) => {
  const istDateStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // "YYYY-MM-DD"
  const istDayStart = new Date(istDateStr + 'T00:00:00+05:30');
  const istDayEnd   = new Date(istDateStr + 'T23:59:59+05:30');

  const ads = await prisma.ad.findMany();
  const ad = ads.find((a) =>
    a.startDate && a.endDate &&
    new Date(a.startDate) <= istDayEnd &&
    new Date(a.endDate)   >= istDayStart
  ) ?? null;
  res.json({ success: true, data: ad });
};

exports.create = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const ad = await prisma.ad.create({
    data: { title, startDate: toISTStart(startDate), endDate: toISTEnd(endDate) },
  });
  res.json({ success: true, data: ad });
};

exports.update = async (req, res) => {
  const { title, startDate, endDate } = req.body;
  const data = { title, startDate: toISTStart(startDate), endDate: toISTEnd(endDate) };
  if (req.file) data.fileName = req.file.filename;
  await prisma.ad.update({ where: { id: Number(req.params.id) }, data });
  res.json({ success: true, message: 'Ad updated' });
};

exports.remove = async (req, res) => {
  await prisma.ad.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'Ad deleted' });
};
