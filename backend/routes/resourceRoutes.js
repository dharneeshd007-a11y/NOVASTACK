const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', resourceController.getResources);
router.post('/', verifyRole(['admin']), resourceController.createResource);
router.patch('/:id/status', verifyRole(['admin', 'hospital_admin', 'ambulance', 'police', 'fire']), resourceController.updateResourceStatus);

module.exports = router;
