const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole(['hospital_admin']), auditController.getAuditLogs);

module.exports = router;
