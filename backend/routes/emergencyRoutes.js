const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.post('/', verifyToken, emergencyController.createEmergency);
router.get('/', verifyToken, emergencyController.getEmergencies);
router.get('/history', verifyToken, verifyRole(['hospital_admin']), emergencyController.getResponseHistory);
router.get('/:id', verifyToken, emergencyController.getEmergencyById);

// Admin Assignment
router.post('/:id/assign', verifyToken, verifyRole(['hospital_admin']), emergencyController.assignResponder);

// Responder Workflow
router.post('/:id/accept', verifyToken, verifyRole(['ambulance_driver']), emergencyController.acceptEmergency);
router.post('/:id/decline', verifyToken, verifyRole(['ambulance_driver']), emergencyController.declineEmergency);
router.patch('/:id/status', verifyToken, verifyRole(['ambulance_driver', 'hospital', 'system_admin']), emergencyController.updateEmergencyStatus);

// Legacy 
router.patch('/:id/status', verifyToken, verifyRole(['driver', 'hospital_admin']), emergencyController.updateStatus);

module.exports = router;
