const express = require("express");
const router = express.Router();
const {
  chat,
  getHistory,
  clearHistory,
} = require("../controllers/geminiController");

// POST /api/gemini/chat        — Send message, get AI response (public)
router.post("/chat", chat);

// GET /api/gemini/history      — Get user's chat history (requires auth)
router.get("/history", getHistory);

// DELETE /api/gemini/history   — Clear user's chat history (requires auth)
router.delete("/history", clearHistory);

module.exports = router;
