const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/contact.controller');

router.get('/', auth, c.list);
router.post('/', auth, c.add);
router.put('/', auth, c.update);
router.delete('/:id', auth, c.remove);
router.post('/set-default', auth, c.setDefault);

module.exports = router;
