const router = require('express').Router();
const apiAuth = require('../../middleware/apiAuth');
const auth = require('../../middleware/auth');
const c = require('../../controllers/api/mobile.controller');

router.use(apiAuth);
router.post('/login', c.login);
router.post('/forgot-password', c.sendForgotPasswordLink);
router.post('/reset-password', c.resetPassword);
router.post('/validate-auth-password', auth, c.validateAuthPassword);
router.post('/reset-auth-password', auth, c.resetAuthPassword);
router.post('/download-pricelist/:type', auth, c.downloadPriceList);
router.post('/download-order', auth, c.downloadOrder);
router.get('/brochures', auth, c.listEBrochures);

module.exports = router;
