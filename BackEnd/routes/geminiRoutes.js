const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { chat, getHistory, clearHistory } = require('../controllers/geminiController');

// All routes require JWT authentication
router.use(authMiddleware);

// POST /api/gemini/chat        — Send message, get AI response
router.post('/chat', chat);

// GET /api/gemini/history      — Get user's chat history
router.get('/history', getHistory);

// DELETE /api/gemini/history   — Clear user's chat history
router.delete('/history', clearHistory);

module.exports = router;
