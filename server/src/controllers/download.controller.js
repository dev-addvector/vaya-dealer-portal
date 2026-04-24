const erpService = require('../services/erp.service');
const { generatePriceListPdf } = require('../services/pdf.service');
const prisma = require('../config/database');

exports.listEbrochures = async (req, res) => {
  const records = await prisma.ebrochureFile.findMany({ orderBy: { createdAt: 'desc' } });
  const data = records.map((r) => ({
    id: r.id,
    name: r.ebrochure ? r.ebrochure.replace(/\.pdf$/i, '').replace(/-/g, ' ') : '',
    filename: r.ebrochure,
    url: `/uploads/ebrochures/${encodeURIComponent(r.ebrochure)}`,
  }));
  res.json({ success: true, data });
};

exports.downloadPriceListCsv = async (req, res) => {
  const { unc, keyParse } = req.user;
  const [userDetails, items] = await Promise.all([
    erpService.getUserDetails(unc, keyParse),
    erpService.getPriceListJson(unc),
  ]);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=Price-list.csv');

  const rows = [
    ['Vaya Dealer Price List', `Customer Name : ${userDetails.customerName}`, `Customer Code : ${userDetails.customerCode}`, `Consignee Category : ${userDetails.consigneeCategory}`],
    ['Pattern', 'DP Cut Price', 'DP Roll Price'],
    ...items.map(item => [
      item.Pattern || '',
      item['Cut Price'] ? Number(item['Cut Price']).toLocaleString('en-IN') : '',
      item['Roll Price'] ? Number(item['Roll Price']).toLocaleString('en-IN') : '',
    ]),
  ];

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  res.send(csv);
};

exports.downloadPriceListPdf = async (req, res) => {
  const { unc, keyParse } = req.user;
  const [userDetails, items] = await Promise.all([
    erpService.getUserDetails(unc, keyParse),
    erpService.getPriceListJson(unc),
  ]);

  const pdfBuffer = await generatePriceListPdf({ userDetails, items });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=Price-list.pdf');
  res.send(pdfBuffer);
};
