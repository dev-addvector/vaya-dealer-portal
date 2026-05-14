const router = require('express').Router();
const c = require('../controllers/stocks.controller');

router.get('/', c.list);

module.exports = router;
