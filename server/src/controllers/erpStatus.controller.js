const erpService = require('../services/erp.service');

exports.check = async (req, res) => {
  try {
    await erpService.getUserDetails(req.user.unc, req.user.keyParse);
    res.json({ online: true });
  } catch {
    res.json({ online: false });
  }
};
