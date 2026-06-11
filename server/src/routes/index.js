const router = require('express').Router();
const auth = require('../middleware/auth');
const adsController = require('../controllers/admin/ads.controller');
const erpStatusController = require('../controllers/erpStatus.controller');

router.get('/ads/active', auth, adsController.getActive);
router.get('/erp-status', auth, erpStatusController.check);

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/orders', require('./order.routes'));
router.use('/addresses', require('./address.routes'));
router.use('/contacts', require('./contact.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/admin', require('./admin/index'));
router.use('/mobile', require('./api/mobile.routes'));
router.use('/downloads', require('./download.routes'));
router.use('/stocks', require('./stocks.routes'));

module.exports = router;
