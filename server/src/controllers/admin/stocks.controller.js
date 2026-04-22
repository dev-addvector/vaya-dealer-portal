const erpService = require('../../services/erp.service');

exports.list = async (req, res) => {
  try {
    const stocks = await erpService.getStocks('BC');
    res.json({ success: true, data: stocks });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Failed to fetch stock data from ERP', error: err.message });
  }
};
