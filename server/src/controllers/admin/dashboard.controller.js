const prisma = require('../../config/database');

// Interpret date strings as IST (UTC+5:30) so records stored with UTC timestamps
// are correctly included when filtering by the Indian calendar date.
function toISTStart(dateStr) { return new Date(dateStr + 'T00:00:00+05:30'); }
function toISTEnd(dateStr)   { return new Date(dateStr + 'T23:59:59+05:30'); }

function buildPrismaWhere({ from, to, searchString, location, consigneeName }) {
  const where = {};
  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = toISTStart(from);
    if (to) where.timestamp.lte = toISTEnd(to);
  }
  if (searchString) where.search_string = searchString;
  if (location) where.location = location;
  if (consigneeName) where.consignee_name = consigneeName;
  return where;
}

function buildMongoMatch({ from, to, searchString, location, consigneeName }) {
  const match = {};
  if (from || to) {
    match.timestamp = {};
    if (from) match.timestamp.$gte = { $date: toISTStart(from).toISOString() };
    if (to) match.timestamp.$lte = { $date: toISTEnd(to).toISOString() };
  }
  if (searchString) match.search_string = searchString;
  if (location) match.location = location;
  if (consigneeName) match.consignee_name = consigneeName;
  return match;
}

exports.index = async (req, res) => {
  const [consignees, searchStrings, locations] = await Promise.all([
    prisma.searchReport.groupBy({
      by: ['consignee_name'],
      where: { consignee_name: { not: null } },
      orderBy: { consignee_name: 'asc' },
    }),
    prisma.searchReport.groupBy({
      by: ['search_string'],
      where: { search_string: { not: null } },
      orderBy: { search_string: 'asc' },
    }),
    prisma.searchReport.groupBy({
      by: ['location'],
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
  const params = { from, to, searchString, location, consigneeName };
  const baseWhere = buildPrismaWhere(params);
  const baseMatch = buildMongoMatch(params);

  const [avgResult, topSearchStrings, locationMap, top5Consignees, datesResult] = await Promise.all([
    prisma.$runCommandRaw({
      aggregate: 'search_reports',
      pipeline: [
        { $match: baseMatch },
        {
          $group: {
            _id: null,
            avg_elapsed: { $avg: { $toDouble: { $ifNull: ['$elpsed_time', '0'] } } },
            avg_row_count: { $avg: { $ifNull: ['$row_count', 0] } },
          },
        },
      ],
      cursor: {},
    }),
    prisma.$runCommandRaw({
      aggregate: 'search_reports',
      pipeline: [
        { $match: { ...baseMatch, search_string: { $nin: [null, ''] } } },
        { $group: { _id: { $toLower: '$search_string' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ],
      cursor: {},
    }),
    prisma.searchReport.groupBy({
      by: ['location'],
      _count: { location: true },
      where: { ...baseWhere, location: { not: null } },
      orderBy: { _count: { location: 'desc' } },
      take: 10,
    }),
    prisma.searchReport.groupBy({
      by: ['consignee_name'],
      _count: { consignee_name: true },
      where: { ...baseWhere, consignee_name: { not: null } },
      orderBy: { _count: { consignee_name: 'desc' } },
      take: 5,
    }),
    prisma.$runCommandRaw({
      aggregate: 'search_reports',
      pipeline: [
        { $match: baseMatch },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } } } },
        { $sort: { _id: 1 } },
        { $limit: 100 },
      ],
      cursor: {},
    }),
  ]);

  const avgRow = (avgResult.cursor?.firstBatch ?? [])[0] ?? {};
  const avgElapsed = parseFloat(avgRow.avg_elapsed ?? 0);
  const avgRowCount = parseFloat(avgRow.avg_row_count ?? 0);
  const avgPerSec = avgElapsed > 0 ? parseFloat((avgRowCount / avgElapsed).toFixed(2)) : 0;

  const dates = (datesResult.cursor?.firstBatch ?? []).map((d) => d._id).filter(Boolean);

  const usersData = await Promise.all(
    top5Consignees.map(async (row) => {
      const dailyResult = await prisma.$runCommandRaw({
        aggregate: 'search_reports',
        pipeline: [
          { $match: { ...baseMatch, consignee_name: row.consignee_name } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ],
        cursor: {},
      });
      const daily = dailyResult.cursor?.firstBatch ?? [];
      const dayMap = Object.fromEntries(daily.map((d) => [d._id, d.count]));
      return { name: row.consignee_name, data: dates.map((d) => dayMap[d] ?? 0) };
    })
  );

  res.json({
    success: true,
    data: {
      averageTimeElpsed: parseFloat(avgElapsed.toFixed(2)),
      averageRecord: parseFloat(avgRowCount.toFixed(2)),
      averageRecordPerSec: avgPerSec,
      topSearchString: {
        search_string: (topSearchStrings.cursor?.firstBatch ?? []).map((r) => r._id),
        count: (topSearchStrings.cursor?.firstBatch ?? []).map((r) => r.count),
      },
      topConsignee: {
        dates,
        users: usersData,
      },
      locationMap: locationMap.map((r) => ({ location: r.location, count: r._count.location })),
    },
  });
};

exports.downloadChartData = async (req, res) => {
  const { from, to, searchString, location, consigneeName } = req.body;
  const where = buildPrismaWhere({ from, to, searchString, location, consigneeName });

  const records = await prisma.searchReport.findMany({ where, orderBy: { timestamp: 'asc' } });

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
