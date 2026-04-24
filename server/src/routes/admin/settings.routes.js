const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/settings.controller');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/settings') });

router.get('/', c.get);
router.post('/smtp', c.setSMTP);
router.post('/max-reserve-days', c.setMaxReserveDays);
router.post('/gst', c.setGst);
router.post('/qr-link', c.setQrLink);
router.post('/upload-login-image', upload.single('image'), c.uploadLoginImage);
router.get('/qr/download', c.downloadQr);
router.get('/users', c.listUsers);
router.post('/users/disable', c.disableUser);
router.post('/users/change-email', c.changeUserEmail);
router.post('/users/send-reset-password', c.sendPasswordResetLink);

module.exports = router;
