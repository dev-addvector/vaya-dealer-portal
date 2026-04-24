const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/ads.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/ads') });
const superOnly = requireRoles(ROLES.ADMIN);

router.get('/', superOnly, c.list);
router.get('/active', superOnly, c.getActive);
router.post('/', superOnly, upload.single('image'), c.create);
router.put('/:id', superOnly, upload.single('image'), c.update);
router.delete('/:id', superOnly, c.remove);

module.exports = router;
