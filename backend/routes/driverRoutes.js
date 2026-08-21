const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.post('/status', verifyToken, verifyRole(['ambulance_driver']), driverController.updateStatus);

module.exports = router;
