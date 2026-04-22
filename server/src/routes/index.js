const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/products', require('./product.routes'));
router.use('/orders', require('./order.routes'));
router.use('/addresses', require('./address.routes'));
router.use('/contacts', require('./contact.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/admin', require('./admin/index'));
router.use('/mobile', require('./api/mobile.routes'));
router.use('/downloads', require('./download.routes'));

module.exports = router;
