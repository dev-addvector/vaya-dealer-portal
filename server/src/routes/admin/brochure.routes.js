const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/brochure.controller');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/brochures') });

router.get('/', c.list);
router.post('/', upload.single('file'), c.create);
router.put('/:id', upload.single('file'), c.update);
router.delete('/:id', c.remove);

module.exports = router;
