const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/order.controller');

router.get('/my-orders', auth, c.getMyOrders);
router.get('/open-orders', auth, c.getOpenOrders);
router.get('/reserved-orders', auth, c.getReservedOrders);
router.get('/download/:po', auth, c.downloadOrder);
router.get('/download-open-order', auth, c.downloadOpenOrderPdf);
router.post('/cancel/:id', auth, c.cancelOrder);
router.post('/convert-reserved/*', auth, c.convertReservedToOrder);

module.exports = router;
