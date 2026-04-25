const router = require('express').Router();
const c = require('../../controllers/admin/stocks.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

router.get('/', requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN), c.list);

module.exports = router;
