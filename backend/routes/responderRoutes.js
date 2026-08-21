const express = require('express');
const router = express.Router();
const responderController = require('../controllers/responderController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole(['hospital_admin']), responderController.getResponders);
router.patch('/status', verifyToken, verifyRole(['driver', 'hospital_admin']), responderController.updateStatus);
router.patch('/location', verifyToken, verifyRole(['driver', 'hospital_admin']), responderController.updateLocation);

module.exports = router;
