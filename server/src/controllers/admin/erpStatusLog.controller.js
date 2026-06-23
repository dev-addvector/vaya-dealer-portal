const prisma = require('../../config/database');

function toISTStart(d) { return new Date(d + 'T00:00:00+05:30'); }
function toISTEnd(d)   { return new Date(d + 'T23:59:59+05:30'); }

exports.getStatus = async (req, res) => {
  const [latest, history] = await Promise.all([
    prisma.erpStatusLog.findFirst({ orderBy: { checkedAt: 'desc' } }),
    prisma.erpStatusLog.findMany({
      orderBy: { checkedAt: 'desc' },
      take: 16,
    }),
  ]);
  res.json({ latest, history });
};

exports.getHistory = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize) || 20));
  const skip = (page - 1) * pageSize;

  const where = {};
  if (req.query.dateFrom || req.query.dateTo) {
    where.checkedAt = {};
    if (req.query.dateFrom) where.checkedAt.gte = toISTStart(req.query.dateFrom);
    if (req.query.dateTo)   where.checkedAt.lte = toISTEnd(req.query.dateTo);
  }

  const [total, records] = await Promise.all([
    prisma.erpStatusLog.count({ where }),
    prisma.erpStatusLog.findMany({
      where,
      orderBy: { checkedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  res.json({ records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
};
