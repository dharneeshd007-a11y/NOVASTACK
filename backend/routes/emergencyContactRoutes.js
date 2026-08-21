const express = require('express');
const router = express.Router();
const emergencyContactController = require('../controllers/emergencyContactController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', emergencyContactController.getContacts);
router.post('/', emergencyContactController.createContact);
router.delete('/:id', emergencyContactController.deleteContact);

module.exports = router;
