const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/ebrochure.controller');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/ebrochures'),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, safe);
  },
});
const upload = multer({ storage, fileFilter: (req, file, cb) => cb(null, file.mimetype === 'application/pdf') });

router.get('/', c.list);
router.post('/', upload.single('file'), c.upload);
router.delete('/:id', c.remove);

module.exports = router;
