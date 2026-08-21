const express = require('express');
const router = express.Router();
const publicAlertController = require('../controllers/publicAlertController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', publicAlertController.getAlerts);
router.post('/', verifyRole(['admin', 'hospital_admin', 'police', 'fire']), publicAlertController.createAlert);

module.exports = router;
