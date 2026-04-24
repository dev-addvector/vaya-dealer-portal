const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/brochure.controller');

const csvStorage = multer.diskStorage({
  destination: path.join(__dirname, '../../../uploads/brochures'),
  filename: (_req, file, cb) => {
    cb(null, file.originalname.replace(/\s+/g, '_'));
  },
});

const upload = multer({
  storage: csvStorage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

router.get('/', c.list);
router.post('/upload-csv', upload.single('csv_file'), c.uploadCSV);
router.delete('/:id', c.remove);

module.exports = router;
