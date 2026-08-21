const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Allow admin and hospital_admin to view/create agencies
router.use(verifyToken);

router.get('/', agencyController.getAgencies);
router.post('/', verifyRole(['admin', 'hospital_admin']), agencyController.createAgency);
router.patch('/:id/status', verifyRole(['admin', 'hospital_admin']), agencyController.updateAgencyStatus);

module.exports = router;
