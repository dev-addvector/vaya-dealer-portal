const prisma = require('../../config/database');

function toISTStart(d) { return new Date(d + 'T00:00:00+05:30'); }
function toISTEnd(d)   { return new Date(d + 'T23:59:59+05:30'); }

exports.getErrorLogs = async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 10));
  const skip = (page - 1) * perPage;

  const where = {};
  if (req.query.from || req.query.to) {
    where.createdAt = {};
    if (req.query.from) where.createdAt.gte = toISTStart(req.query.from);
    if (req.query.to)   where.createdAt.lte = toISTEnd(req.query.to);
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
