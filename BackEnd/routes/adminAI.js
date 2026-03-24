const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const {
  processCommand,
  getPendingApprovals,
  approveAction,
  rejectAction,
  getAuditLogs,
  getBotStats
} = require('../controllers/aiAdminController');
const { authMiddleware, authorize } = require('../middleware/auth');

// ── Existing summary route (preserved) ────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const summary = await Order.aggregate([
      { $group: { _id: '$productId', totalQuantity: { $sum: '$quantity' }, totalRevenue: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
      { $sort: { totalQuantity: -1 } },
      { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $project: { productId: '$_id', productName: '$product.name', productPrice: '$product.price', totalQuantity: 1, totalRevenue: 1, orderCount: 1, _id: 0 } }
    ]);
    res.json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error', message: error.message });
  }
});

// ── All AI Admin Bot routes require authentication ─────────────
router.use(authMiddleware);

// Bot command endpoint (admin + superAdmin)
router.post('/command',     authorize('admin', 'superAdmin'), processCommand);

// Stats
router.get('/stats',        authorize('admin', 'superAdmin'), getBotStats);

// Audit logs
router.get('/audit-logs',   authorize('admin', 'superAdmin'), getAuditLogs);

// SuperAdmin-only: approval management
router.get('/pending',      authorize('superAdmin'), getPendingApprovals);
router.post('/approve/:id', authorize('superAdmin'), approveAction);
router.post('/reject/:id',  authorize('superAdmin'), rejectAction);

module.exports = router;
