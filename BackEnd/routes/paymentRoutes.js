const express = require('express');
const router = express.Router();
const {
  getPaymentConfig,
  updatePaymentConfig,
  processPayment,
  verifyPayment,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getTransactionHistory
} = require('../controllers/paymentController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Public routes
router.get('/methods', getPaymentMethods);

// User routes
router.post('/process', authMiddleware, processPayment);
router.post('/verify', authMiddleware, verifyPayment);
router.get('/history', authMiddleware, getTransactionHistory);

// Admin/SuperAdmin/Manager can view config (read-only for manager)
router.get('/config', authMiddleware, authorize('manager', 'admin', 'superAdmin'), getPaymentConfig);
router.put('/config', authMiddleware, authorize('superAdmin'), updatePaymentConfig);
router.post('/methods', authMiddleware, authorize('superAdmin'), addPaymentMethod);
router.delete('/methods/:methodId', authMiddleware, authorize('superAdmin'), removePaymentMethod);

module.exports = router;