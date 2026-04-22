const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/profile.controller');

router.get('/', auth, c.get);
router.post('/reset-password', auth, c.resetLoginPassword);
router.post('/reset-auth-password', auth, c.resetAuthorizationPassword);
router.post('/validate-auth-password', auth, c.validateAuthorizationPassword);

module.exports = router;
