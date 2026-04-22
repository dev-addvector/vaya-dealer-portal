const router = require('express').Router();
const c = require('../../controllers/admin/stocks.controller');

router.get('/', c.list);

module.exports = router;
