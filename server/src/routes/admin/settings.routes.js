const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const c = require('../../controllers/admin/settings.controller');
const { requireRoles } = require('../../middleware/roleAuth');
const { ROLES } = require('../../config/constants');

const upload = multer({ dest: path.join(__dirname, '../../../uploads/settings') });

const superOnly = requireRoles(ROLES.ADMIN);
const superOrSub = requireRoles(ROLES.ADMIN, ROLES.SUB_ADMIN);
const superOrQr = requireRoles(ROLES.ADMIN, ROLES.QR_ADMIN);

router.get('/', c.get);
router.post('/smtp', superOnly, c.setSMTP);
router.post('/max-reserve-days', superOnly, c.setMaxReserveDays);
router.post('/gst', superOnly, c.setGst);
router.post('/qr-link', c.setQrLink);
router.post('/upload-login-image', superOnly, upload.single('image'), c.uploadLoginImage);
router.get('/qr/download', superOrQr, c.downloadQr);
router.get('/users', superOrSub, c.listUsers);
router.post('/users/disable', superOrSub, c.disableUser);
router.post('/users/change-email', superOrSub, c.changeUserEmail);
router.post('/users/send-reset-password', superOrSub, c.sendPasswordResetLink);

module.exports = router;
