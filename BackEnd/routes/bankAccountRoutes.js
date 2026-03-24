const express = require('express');
const router = express.Router();
const {
  getAllBankAccounts,
  getActiveBankAccounts,
  addBankAccount,
  updateBankAccount,
  toggleBankAccountStatus,
  deleteBankAccount,
  setPrimaryBankAccount,
  generateUPIQRCode,
  getBankAccountStats
} = require('../controllers/bankAccountController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Public route - get active bank accounts for payment
router.get('/active', getActiveBankAccounts);

// Generate QR Code (authenticated users)
router.get('/:id/qr', authMiddleware, generateUPIQRCode);

// Super Admin only routes
router.use(authMiddleware, authorize('superAdmin'));

router.get('/', getAllBankAccounts);
router.get('/stats', getBankAccountStats);
router.post('/', addBankAccount);
router.put('/:id', updateBankAccount);
router.patch('/:id/toggle-status', toggleBankAccountStatus);
router.patch('/:id/set-primary', setPrimaryBankAccount);
router.delete('/:id', deleteBankAccount);

module.exports = router;
