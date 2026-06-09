const prisma = require('../../config/database');

exports.getErrorLogs = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 10));
  const skip = (page - 1) * perPage;

  const where = {};
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) {
      where.createdAt.gte = new Date(req.query.from);
    }
    if (req.query.to) {
      const toDate = new Date(req.query.to);
      toDate.setHours(23, 59, 59, 999);
      where.createdAt.lte = toDate;
    }
  }

  const [logs, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.errorLog.count({ where }),
  ]);

  res.json({ success: true, data: logs, total });
};
