const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/ads.controller');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/ads') });

router.get('/', c.list);
router.get('/active', c.getActive);
router.post('/', upload.single('image'), c.create);
router.put('/:id', upload.single('image'), c.update);
router.delete('/:id', c.remove);

module.exports = router;
