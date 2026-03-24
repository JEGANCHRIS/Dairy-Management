const express = require('express');
const router = express.Router();
const {
  submitContact,
  getContacts,
  getContactById,
  updateContactStatus,
  deleteContact
} = require('../controllers/contactController');
const { authMiddleware } = require('../middleware/auth');

// Public route - submit contact form
router.post('/', submitContact);

// Protected routes - for admin to manage contacts
router.get('/', authMiddleware, getContacts);
router.get('/:id', authMiddleware, getContactById);
router.put('/:id/status', authMiddleware, updateContactStatus);
router.delete('/:id', authMiddleware, deleteContact);

module.exports = router;
