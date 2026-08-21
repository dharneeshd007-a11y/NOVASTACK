const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/overview', verifyToken, verifyRole(['hospital_admin']), analyticsController.getOverview);
router.get('/trends', verifyToken, verifyRole(['hospital_admin']), analyticsController.getTrends);
router.get('/types', verifyToken, verifyRole(['hospital_admin']), analyticsController.getTypes);

module.exports = router;
