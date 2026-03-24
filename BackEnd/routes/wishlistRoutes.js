const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  getWishlistCount
} = require('../controllers/wishlistController');
const { authMiddleware } = require('../middleware/auth');

// All wishlist routes require authentication
router.use(authMiddleware);

// Get wishlist
router.get('/', getWishlist);

// Get wishlist count
router.get('/count', getWishlistCount);

// Add to wishlist
router.post('/add', addToWishlist);

// Remove from wishlist
router.delete('/remove/:productId', removeFromWishlist);

// Check if product is in wishlist
router.get('/check/:productId', checkWishlistStatus);

module.exports = router;
