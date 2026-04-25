const router = require('express').Router();
const c = require('../../controllers/admin/subadmin.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const superOnly = requireRoles(ROLES.ADMIN);
const superOrSub = requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN);

router.get('/', superOrSub, c.list);
router.post('/', superOrSub, c.create);
router.put('/:id', superOnly, c.update);
router.delete('/:id', superOnly, c.remove);

module.exports = router;
