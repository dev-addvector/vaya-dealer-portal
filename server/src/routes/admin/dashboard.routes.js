const router = require('express').Router();
const c = require('../../controllers/admin/dashboard.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const superOrSub = requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN);

router.get('/', superOrSub, c.index);
router.post('/chart-data', superOrSub, c.loadChartData);
router.post('/download', superOrSub, c.downloadChartData);

module.exports = router;
