const express = require('express');
const router = express.Router();
const {
  getBlogs,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  getFeaturedBlogs,
  incrementViews
} = require('../controllers/blogController');
const { authMiddleware, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getBlogs);
router.get('/featured', getFeaturedBlogs);
router.get('/:id', getBlogById);
router.put('/:id/view', incrementViews);

// Admin/SuperAdmin only routes
router.post('/', authMiddleware, authorize('admin', 'superAdmin'), createBlog);
router.put('/:id', authMiddleware, authorize('admin', 'superAdmin'), updateBlog);
router.delete('/:id', authMiddleware, authorize('admin', 'superAdmin'), deleteBlog);

module.exports = router;