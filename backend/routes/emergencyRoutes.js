const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/', verifyToken, emergencyController.createEmergency);
router.get('/', verifyToken, emergencyController.getEmergencies);
router.get('/:id', verifyToken, emergencyController.getEmergencyById);
router.patch('/:id/status', verifyToken, verifyRole(['driver', 'hospital_admin']), emergencyController.updateStatus);

module.exports = router;
