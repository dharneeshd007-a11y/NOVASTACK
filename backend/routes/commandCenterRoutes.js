const express = require('express');
const router = express.Router();
const commandCenterController = require('../controllers/commandCenterController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, verifyRole(['hospital_admin']), commandCenterController.getCommandCenterState);

module.exports = router;
