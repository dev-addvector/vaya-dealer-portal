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

  const [total, records] = await Promise.all([
    prisma.erpStatusLog.count(),
    prisma.erpStatusLog.findMany({
      orderBy: { checkedAt: 'desc' },
      skip,
      take: pageSize,
    }),
  ]);

  res.json({ records, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
};
