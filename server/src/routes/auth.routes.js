const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/auth.controller');

router.get('/login-image', c.getLoginImage);
router.post('/login', c.login);
router.post('/logout', auth, c.logout);
router.post('/forgot-password', c.sendForgotPasswordLink);
router.post('/reset-password', c.resetPassword);

module.exports = router;
