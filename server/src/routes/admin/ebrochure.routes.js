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

const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const superOnly = requireRoles(ROLES.ADMIN);

router.get('/', superOnly, c.list);
router.post('/', superOnly, upload.single('file'), c.upload);
router.delete('/:id', superOnly, c.remove);

module.exports = router;
