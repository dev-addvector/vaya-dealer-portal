const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/download.controller');

router.get('/ebrochures', auth, c.listEbrochures);
router.get('/price-list', auth, c.downloadPriceListCsv);
router.get('/price-list-pdf', auth, c.downloadPriceListPdf);

module.exports = router;
