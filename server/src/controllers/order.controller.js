const erpService = require('../services/erp.service');

exports.getMyOrders = async (req, res) => {
  const data = await erpService.getMyOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.getOpenOrders = async (req, res) => {
  const data = await erpService.getOpenOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.getReservedOrders = async (req, res) => {
  const data = await erpService.getReservedOrders({ unc: req.user.unc });
  res.json({ success: true, data });
};

exports.downloadOrder = async (req, res) => {
  const pdfBuffer = await erpService.getOrderPdf(req.params.po);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=order-${req.params.po}.pdf`);
  res.send(pdfBuffer);
};

exports.cancelOrder = async (req, res) => {
  const result = await erpService.cancelOrder(req.user.unc, req.params.id);
  res.json(result);
};

exports.convertReservedToOrder = async (req, res) => {
  res.json({ success: true, message: 'Order converted' });
};

exports.downloadOpenOrderPdf = async (req, res) => {
  const { po } = req.query;
  if (!po) return res.status(400).json({ error: 'po query param is required' });
  const pdfBuffer = await erpService.generateOpenOrderPdf({ unc: req.user.unc, poNumber: po });
  const safeName = po.replace(/[^a-zA-Z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`);
  res.send(pdfBuffer);
};
