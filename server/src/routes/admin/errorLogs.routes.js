const router = require('express').Router();
const { getErrorLogs } = require('../../controllers/admin/errorLogs.controller');

router.get('/', getErrorLogs);

module.exports = router;
