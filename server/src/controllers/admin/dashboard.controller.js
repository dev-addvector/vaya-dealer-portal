const prisma = require('../../config/database');

function buildWhere(conditions) {
  if (!conditions.length) return { sql: '', params: [] };
  return {
    sql: 'WHERE ' + conditions.map((c) => c.sql).join(' AND '),
    params: conditions.flatMap((c) => c.params),
  };
}

exports.index = async (req, res) => {
  const [consignees, searchStrings, locations] = await Promise.all([
    prisma.search_report.findMany({
      select: { consignee_name: true },
      distinct: ['consignee_name'],
      where: { consignee_name: { not: null } },
      orderBy: { consignee_name: 'asc' },
    }),
    prisma.search_report.findMany({
      select: { search_string: true },
      distinct: ['search_string'],
      where: { search_string: { not: null } },
      orderBy: { search_string: 'asc' },
    }),
    prisma.search_report.findMany({
      select: { location: true },
      distinct: ['location'],
      where: { AND: [{ location: { not: null } }, { location: { not: 'India' } }] },
      orderBy: { location: 'asc' },
    }),
  ]);

  res.json({
    success: true,
    data: {
      consigneeNameArray: consignees.map((r) => r.consignee_name).filter(Boolean),
      searchStringArray: searchStrings.map((r) => r.search_string).filter(Boolean),
      locationArray: locations.map((r) => r.location).filter(Boolean),
    },
  });
};

exports.loadChartData = async (req, res) => {
  const { from, to, searchString, location, consigneeName } = req.body;

  const conditions = [];
  if (from) conditions.push({ sql: 'timestamp >= ?', params: [new Date(from)] });
  if (to) conditions.push({ sql: 'timestamp <= ?', params: [new Date(to + 'T23:59:59')] });
  if (searchString) conditions.push({ sql: 'search_string = ?', params: [searchString] });
  if (location) conditions.push({ sql: 'location = ?', params: [location] });
  if (consigneeName) conditions.push({ sql: 'consignee_name = ?', params: [consigneeName] });

  const { sql: whereBase, params: baseParams } = buildWhere(conditions);

  const ssWhere = buildWhere([...conditions, { sql: 'search_string IS NOT NULL', params: [] }]);
  const locWhere = buildWhere([...conditions, { sql: 'location IS NOT NULL', params: [] }]);
  const cnWhere = buildWhere([...conditions, { sql: 'consignee_name IS NOT NULL', params: [] }]);

  const [avgRows, topSearchStrings, locationMap, top5Consignees, dates] = await Promise.all([
    prisma.$queryRawUnsafe(
      `SELECT AVG(CAST(elpsed_time AS DECIMAL(10,4))) as avg_elapsed, AVG(row_count) as avg_row_count FROM search_report ${whereBase}`,
      ...baseParams
    ),
    prisma.$queryRawUnsafe(
      `SELECT search_string, COUNT(*) as count FROM search_report ${ssWhere.sql} GROUP BY search_string ORDER BY count DESC LIMIT 5`,
      ...ssWhere.params
    ),
    prisma.$queryRawUnsafe(
      `SELECT location, COUNT(*) as count FROM search_report ${locWhere.sql} GROUP BY location ORDER BY count DESC LIMIT 10`,
      ...locWhere.params
    ),
    prisma.$queryRawUnsafe(
      `SELECT consignee_name, COUNT(*) as total FROM search_report ${cnWhere.sql} GROUP BY consignee_name ORDER BY total DESC LIMIT 5`,
      ...cnWhere.params
    ),
    prisma.$queryRawUnsafe(
      `SELECT DISTINCT DATE_FORMAT(timestamp, '%Y-%m-%d') as date FROM search_report ${whereBase} ORDER BY date ASC LIMIT 100`,
      ...baseParams
    ),
  ]);

  const usersData = await Promise.all(
    top5Consignees.map(async (row) => {
      const userWhere = buildWhere([...conditions, { sql: 'consignee_name = ?', params: [row.consignee_name] }]);
      const daily = await prisma.$queryRawUnsafe(
        `SELECT DATE_FORMAT(timestamp, '%Y-%m-%d') as date, COUNT(*) as count FROM search_report ${userWhere.sql} GROUP BY date ORDER BY date ASC`,
        ...userWhere.params
      );
      const dayMap = {};
      daily.forEach((d) => { dayMap[d.date] = Number(d.count); });
      return { name: row.consignee_name, data: dates.map((d) => dayMap[d.date] ?? 0) };
    })
  );

  const avg = avgRows[0] ?? {};
  const avgElapsed = parseFloat(avg.avg_elapsed ?? 0);
  const avgRowCount = parseFloat(avg.avg_row_count ?? 0);
  const avgPerSec = avgElapsed > 0 ? parseFloat((avgRowCount / avgElapsed).toFixed(2)) : 0;

  res.json({
    success: true,
    data: {
      averageTimeElpsed: parseFloat(avgElapsed.toFixed(2)),
      averageRecord: parseFloat(avgRowCount.toFixed(2)),
      averageRecordPerSec: avgPerSec,
      topSearchString: {
        search_string: topSearchStrings.map((r) => r.search_string),
        count: topSearchStrings.map((r) => Number(r.count)),
      },
      topConsignee: {
        dates: dates.map((d) => d.date),
        users: usersData,
      },
      locationMap: locationMap.map((r) => ({ location: r.location, count: Number(r.count) })),
    },
  });
};

exports.downloadChartData = async (req, res) => {
  const { from, to, searchString, location, consigneeName } = req.body;

  const where = {};
  if (from && to) where.timestamp = { gte: new Date(from), lte: new Date(to + 'T23:59:59') };
  if (searchString) where.search_string = searchString;
  if (location) where.location = location;
  if (consigneeName) where.consignee_name = consigneeName;

  const records = await prisma.search_report.findMany({ where, orderBy: { timestamp: 'asc' } });

  const header = ['Sno', 'TimeStamp', 'Location', 'Consignee Name', 'Search String', 'Pattern', 'Color', 'RowCount', 'ElapsedTime'].join(',');
  const rows = records.map((r, i) =>
    [
      i + 1,
      r.timestamp?.toISOString() ?? '',
      r.location ?? '',
      r.consignee_name ?? '',
      r.search_string ?? '',
      r.pattern ?? '',
      r.color ?? '',
      r.row_count ?? '',
      r.elpsed_time ?? '',
    ].join(',')
  );

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '_');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="vaya_dashboard_data_${date}.csv"`);
  res.send([header, ...rows].join('\n'));
};
