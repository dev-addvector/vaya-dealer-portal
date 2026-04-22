const erpService = require('../services/erp.service');
const pdfService = require('../services/pdf.service');
const prisma = require('../config/database');

exports.listEbrochures = async (req, res) => {
  const records = await prisma.multiple_ebrochure_file.findMany({ orderBy: { created_at: 'desc' } });
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

  const date = new Date().toLocaleDateString('en-IN');
  const rows = items.map(item => `
    <tr>
      <td>${item.Pattern || ''}</td>
      <td class="price">${item['Cut Price'] ? Number(item['Cut Price']).toLocaleString('en-IN') : ''}</td>
      <td class="price">${item['Roll Price'] ? Number(item['Roll Price']).toLocaleString('en-IN') : ''}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    h2 { color: #807A52; }
    h4 { margin: 4px 0; font-weight: 400; }
    table, th, td { border: 1px solid #ccc; border-collapse: collapse; }
    th, td { padding: 6px 10px; font-size: 13px; }
    th { background: #E3E8CC; }
    .price { text-align: right; }
  </style></head><body>
    <h2>VAYA Price List</h2>
    <h4>Customer Name : ${userDetails.customerName}</h4>
    <h4>Customer Code : ${userDetails.customerCode}</h4>
    <h4>Consignee Category : ${userDetails.consigneeCategory}</h4>
    <br/>
    <table style="width:100%;">
      <thead>
        <tr><th colspan="3">Date: ${date}</th></tr>
        <tr><th width="60%">Pattern</th><th width="20%">DP Cut Price</th><th width="20%">DP Roll Price</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </body></html>`;

  const pdfBuffer = await pdfService.htmlToPdf(html);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=Price-list.pdf');
  res.send(pdfBuffer);
};
