const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getLatestProducts,
  getCategories,
  filterProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Public routes - MUST be before /:id route
router.get('/latest', getLatestProducts);
router.get('/filter', filterProducts);
router.get('/categories', getCategories);
router.get('/search', searchProducts);
router.get('/', getProducts);

// Get product by ID - MUST be after other GET routes but before admin routes
router.get('/:id', getProductById);

// Admin/SuperAdmin only routes - POST/PUT/DELETE don't conflict with GET
router.post('/', authMiddleware, authorize('admin', 'superAdmin'), createProduct);
router.put('/:id', authMiddleware, authorize('admin', 'superAdmin'), updateProduct);
router.delete('/:id', authMiddleware, authorize('admin', 'superAdmin'), deleteProduct);

module.exports = router;