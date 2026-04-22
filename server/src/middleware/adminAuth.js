const { ROLES, SUBADMIN_ROLES } = require('../config/constants');

module.exports = (req, res, next) => {
  if (!req.user)
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  if (req.user.role === ROLES.ADMIN || SUBADMIN_ROLES.includes(req.user.role))
    return next();
  return res.status(403).json({ success: false, message: 'Forbidden' });
};
