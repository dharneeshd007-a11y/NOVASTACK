const express = require('express');
const router = express.Router();
const hospitalController = require('../controllers/hospitalController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/capacity', hospitalController.getHospitalCapacity);
router.patch('/:id/capacity', verifyRole(['admin', 'hospital', 'hospital_admin']), hospitalController.updateHospitalCapacity);

module.exports = router;
