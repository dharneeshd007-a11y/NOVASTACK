const express = require('express');
const router = express.Router();
const broadcastController = require('../controllers/broadcastController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, broadcastController.getBroadcasts);
router.post('/', verifyToken, verifyRole(['hospital_admin']), broadcastController.sendBroadcast);

module.exports = router;
