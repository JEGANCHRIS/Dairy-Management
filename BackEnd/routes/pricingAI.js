const express = require('express');
const router = express.Router();
const { getPricingSuggestions, applySuggestedPrice } = require('../controllers/pricingAI');
const { authMiddleware, authorize } = require('../middleware/auth');

// Manager and above can view pricing suggestions
router.get('/suggestions', authMiddleware, authorize('admin', 'superAdmin', 'manager'), getPricingSuggestions);

// Admin and SuperAdmin can apply suggested prices
router.post('/apply-price', authMiddleware, authorize('admin', 'superAdmin'), applySuggestedPrice);

module.exports = router;
