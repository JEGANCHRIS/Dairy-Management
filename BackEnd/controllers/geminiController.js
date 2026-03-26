const ChatHistory = require("../models/ChatHistory");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");

// Rate limiting
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count++;
  rateLimitMap.set(userId, entry);
  return entry.count <= 30;
}

// Simple rule-based response generator
function generateResponse(message, userName, userRole) {
  const msg = message.toLowerCase();

  // Greeting
  if (msg.includes("hi") || msg.includes("hello") || msg.includes("hey")) {
    return `Hello ${userName}! 👋 I'm your Dairy Assistant. How can I help you today?`;
  }

  // Products
  if (
    msg.includes("product") ||
    msg.includes("sell") ||
    msg.includes("have") ||
    msg.includes("available")
  ) {
    return "We have fresh milk, paneer, cheese, yogurt, butter, lassi, curd, and ghee! All products are fresh and organic. 🥛🧀";
  }

  // Price
  if (
    msg.includes("price") ||
    msg.includes("cost") ||
    msg.includes("how much") ||
    msg.includes("rupee")
  ) {
    return "Our prices start from ₹45 for sour cream to ₹120 for aged cheddar cheese. All products are competitively priced! 💰";
  }

  // Delivery
  if (
    msg.includes("deliver") ||
    msg.includes("shipping") ||
    msg.includes("time") ||
    msg.includes("day")
  ) {
    return "We deliver within 2-3 days. Free delivery on orders above ₹500! 🚚";
  }

  // Returns
  if (
    msg.includes("return") ||
    msg.includes("refund") ||
    msg.includes("exchange")
  ) {
    return "We accept returns within 7 days if the product is unopened. Quality guaranteed! ✅";
  }

  // Order
  if (
    msg.includes("order") ||
    msg.includes("track") ||
    msg.includes("status")
  ) {
    return "You can track your order in the Orders section of your account. 📦";
  }

  // Cart
  if (msg.includes("cart") || msg.includes("add") || msg.includes("remove")) {
    return 'You can add products to your cart from the product pages. Use the voice command or click "Add to Cart"! 🛒';
  }

  // Payment
  if (
    msg.includes("pay") ||
    msg.includes("payment") ||
    msg.includes("card") ||
    msg.includes("upi")
  ) {
    return "We accept all major payment methods: UPI, Credit/Debit Cards, Net Banking, and Cash on Delivery! 💳";
  }

  // Default response
  return `Thanks for your message, ${userName}! I'm here to help with product info, orders, and general queries. What would you like to know? 🤖`;
}

// POST /api/gemini/chat
const chat = async (req, res) => {
  try {
    const t0 = Date.now();
    const { message, sessionId } = req.body;

    // Get user info from token if available, otherwise use anonymous
    const userId = req.userId ? String(req.userId) : "anonymous";
    const userRole = req.userRole || "guest";
    const userName = req.user?.name || "Guest";

    if (!message?.trim())
      return res.status(400).json({ error: "Message is required" });
    if (!sessionId)
      return res.status(400).json({ error: "Session ID is required" });
    if (!checkRateLimit(userId))
      return res
        .status(429)
        .json({ error: "Too many requests. Please slow down." });

    console.log(`[Chat] ▶ "${message.slice(0, 40)}" — user: ${userName}`);

    // Generate response using simple rule-based system
    // (Ollama removed for Render compatibility)
    const aiReply = generateResponse(message, userName, userRole);

    // Save to session history
    const sessionCache = new Map();
    const h = sessionCache.get(sessionId) || [];
    h.push({ role: "user", content: message.trim() });
    h.push({ role: "assistant", content: aiReply });
    if (h.length > 6) h.splice(0, h.length - 6);
    sessionCache.set(sessionId, h);

    console.log(
      `[Chat] ✓ Total: ${Date.now() - t0}ms — reply: "${aiReply.slice(0, 50)}..."`,
    );
    res.json({ success: true, reply: aiReply, sessionId });
  } catch (err) {
    console.error("[Chat] Chat error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
};

// GET /api/gemini/history
const getHistory = async (req, res) => {
  try {
    const history = await ChatHistory.find({ user: req.userId }).sort({
      lastActivity: -1,
    });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
};

// DELETE /api/gemini/history
const clearHistory = async (req, res) => {
  try {
    await ChatHistory.deleteMany({ user: req.userId });
    res.json({ success: true, message: "History cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
};

module.exports = { chat, getHistory, clearHistory };
