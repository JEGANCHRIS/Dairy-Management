const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats
} = require('../controllers/orderController');
const { authMiddleware, authorize } = require('../middleware/auth');

// User routes
router.post('/', authMiddleware, createOrder);
router.get('/my-orders', authMiddleware, getMyOrders);
router.get('/:id', authMiddleware, getOrderById);
router.put('/:id/cancel', authMiddleware, cancelOrder);

// Admin/Manager routes
router.get('/', authMiddleware, authorize('admin', 'superAdmin', 'manager'), getAllOrders);
router.get('/stats/overview', authMiddleware, authorize('admin', 'superAdmin', 'manager'), getOrderStats);
router.put('/:id/status', authMiddleware, authorize('admin', 'superAdmin', 'manager'), updateOrderStatus);

module.exports = router;