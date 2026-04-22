const router = require('express').Router();
const c = require('../../controllers/admin/dashboard.controller');

router.get('/', c.index);
router.post('/chart-data', c.loadChartData);
router.post('/download', c.downloadChartData);

module.exports = router;
