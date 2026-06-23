const prisma = require('../../config/database');

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
    if (req.query.dateFrom) where.checkedAt.gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) {
      const to = new Date(req.query.dateTo);
      to.setHours(23, 59, 59, 999);
      where.checkedAt.lte = to;
    }
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
