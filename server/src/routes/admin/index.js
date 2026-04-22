const router = require('express').Router();
const auth = require('../../middleware/auth');
const adminAuth = require('../../middleware/adminAuth');

router.use(auth, adminAuth);
router.use('/dashboard', require('./dashboard.routes'));
router.use('/settings', require('./settings.routes'));
router.use('/ads', require('./ads.routes'));
router.use('/brochures', require('./brochure.routes'));
router.use('/subadmins', require('./subadmin.routes'));
router.use('/stocks', require('./stocks.routes'));
router.use('/orders', require('./admin_orders.routes'));
router.use('/ebrochures', require('./ebrochure.routes'));

module.exports = router;
