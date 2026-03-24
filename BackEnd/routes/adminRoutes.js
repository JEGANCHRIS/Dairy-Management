const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUserAnalytics,
  getProductAnalytics,
  getSalesAnalytics,
  manageUser,
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getSystemHealth,
  loginAsUser
} = require('../controllers/adminController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Login-as route (SuperAdmin only) - MUST be before middleware
router.post('/login-as', authMiddleware, authorize('superAdmin'), loginAsUser);

// All other admin routes require authentication
router.use(authMiddleware);

// Dashboard stats — accessible by manager, admin, superAdmin
router.get('/dashboard/stats', authorize('manager', 'admin', 'superAdmin'), getDashboardStats);

// Analytics routes — accessible by manager, admin, superAdmin
router.get('/analytics/users', authorize('manager', 'admin', 'superAdmin'), getUserAnalytics);
router.get('/analytics/products', authorize('manager', 'admin', 'superAdmin'), getProductAnalytics);
router.get('/analytics/sales', authorize('manager', 'admin', 'superAdmin'), getSalesAnalytics);

// User management — admin and superAdmin only
router.use(authorize('admin', 'superAdmin'));

// User listing and details
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);

// SuperAdmin only routes
router.post('/users', authorize('superAdmin'), createUser);
router.put('/users/:id', authorize('superAdmin'), updateUser);
router.delete('/users/:id', authorize('superAdmin'), deleteUser);
router.put('/users/:id/manage', authorize('superAdmin'), manageUser);

// System routes (SuperAdmin only)
router.get('/system-health', authorize('superAdmin'), getSystemHealth);

// Audit logs - accessible by both admin and superAdmin
router.get('/audit-logs', authorize('admin', 'superAdmin'), getAuditLogs);

module.exports = router;