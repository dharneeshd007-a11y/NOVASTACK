const express = require('express');
const router = express.Router({ mergeParams: true }); // Important: merge params for /emergencies/:id/messages
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middleware/auth');

router.get('/', verifyToken, chatController.getMessages);
router.post('/', verifyToken, chatController.sendMessage);

module.exports = router;
