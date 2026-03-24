const ChatHistory = require('../models/ChatHistory');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateLimitMap = new Map();
function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId) || { count: 0, windowStart: now };
  if (now - entry.windowStart > 60000) { entry.count = 0; entry.windowStart = now; }
  entry.count++;
  rateLimitMap.set(userId, entry);
  return entry.count <= 30;
}

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(userRole, userName) {
  let base = `You are Dairy Assistant, a helpful AI for a dairy store. User: ${userName}.
Reply in same language as user. Be brief. Max 80 words. Use bullet points for lists.
Products: milk, paneer, cheese, yogurt, butter, lassi, curd, ghee. Prices in INR.
Returns: 7 days unopened. Delivery: 2-3 days.`;
  if (userRole === 'manager') base += ' Can answer sales/inventory questions.';
  if (userRole === 'admin' || userRole === 'superAdmin') base += ' Can answer sales, inventory and user questions.';
  return base;
}

// ── DB context only when clearly needed ──────────────────────────────────────
async function buildContextData(message, userId, userRole) {
  const msg = message.toLowerCase();
  let ctx = '';
  try {
    const needsProducts = ['price', 'cost', 'stock', 'available', 'how much', 'buy', 'purchase'].some(k => msg.includes(k));
    const needsOrders   = ['my order', 'track', 'my purchase', 'order status', 'delivery status'].some(k => msg.includes(k));
    const needsSales    = ['revenue', 'sales', 'analytics', 'total orders', 'inventory report'].some(k => msg.includes(k));
    const needsUsers    = ['how many users', 'user count', 'registered users', 'active users'].some(k => msg.includes(k));

    if (needsProducts) {
      const products = await Product.find({ isActive: true }).select('name price stock variety').limit(15).lean();
      if (products.length) ctx += `\n[Products]: ${products.map(p => `${p.name} ₹${p.price} (${p.stock > 0 ? 'in stock' : 'out of stock'})`).join(', ')}`;
    }
    if (needsOrders) {
      const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(3).select('_id orderStatus paymentStatus totalAmount').lean();
      if (orders.length) ctx += `\n[Your orders]: ${orders.map(o => `#${String(o._id).slice(-6)} ₹${o.totalAmount} ${o.orderStatus || o.paymentStatus}`).join(', ')}`;
    }
    if (needsSales && ['manager', 'admin', 'superAdmin'].includes(userRole)) {
      const s = await Order.aggregate([{ $group: { _id: null, rev: { $sum: '$totalAmount' }, cnt: { $sum: 1 } } }]);
      if (s[0]) ctx += `\n[Sales]: Revenue ₹${s[0].rev?.toFixed(0)}, Orders: ${s[0].cnt}`;
    }
    if (needsUsers && ['admin', 'superAdmin'].includes(userRole)) {
      const count = await User.countDocuments({ isActive: true });
      ctx += `\n[Users]: ${count} active users`;
    }
  } catch (err) {
    console.error('[Ollama] Context error:', err.message);
  }
  return ctx;
}

// ── In-memory session cache ───────────────────────────────────────────────────
const sessionCache = new Map();
function getSessionHistory(sessionId) { return sessionCache.get(sessionId) || []; }
function addToSessionHistory(sessionId, role, content) {
  const h = sessionCache.get(sessionId) || [];
  h.push({ role, content });
  if (h.length > 6) h.splice(0, h.length - 6);
  sessionCache.set(sessionId, h);
}
function persistHistoryAsync(userId, sessionId) {
  const h = sessionCache.get(sessionId);
  if (!h || h.length % 5 !== 0) return;
  ChatHistory.findOneAndUpdate(
    { user: userId, sessionId },
    { $set: { messages: h, lastActivity: new Date() } },
    { upsert: true, new: true }
  ).catch(e => console.error('[Ollama] Persist error:', e.message));
}

// ── POST /api/gemini/chat ─────────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const t0 = Date.now();
    const { message, sessionId } = req.body;
    const userId   = String(req.userId);
    const userRole = req.userRole;
    const userName = req.user.name;

    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
    if (!sessionId)        return res.status(400).json({ error: 'Session ID is required' });
    if (!checkRateLimit(userId)) return res.status(429).json({ error: 'Too many requests. Please slow down.' });

    const ollamaUrl   = process.env.OLLAMA_URL   || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'llama3.2';

    console.log(`[Chat] ▶ "${message.slice(0, 40)}" — user: ${userName}`);

    const t1 = Date.now();
    const [contextData, history] = await Promise.all([
      buildContextData(message, req.userId, userRole),
      Promise.resolve(getSessionHistory(sessionId))
    ]);
    console.log(`[Chat] ✓ Context built in ${Date.now() - t1}ms`);

    const systemPrompt  = buildSystemPrompt(userRole, userName);
    const fullMessage   = contextData ? `${message.trim()}\n${contextData}` : message.trim();
    const ollamaMessages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: fullMessage }
    ];

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 90000);

    console.log(`[Chat] ▶ Sending to Ollama (${ollamaModel})...`);
    const t2 = Date.now();

    let ollamaRes;
    try {
      ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: ollamaModel,
          messages: ollamaMessages,
          stream: false,
          options: { temperature: 0.7, num_predict: 300 }
        })
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') return res.status(504).json({ error: 'Ollama is taking too long. Make sure Ollama is running with: ollama serve' });
      throw fetchErr;
    }
    clearTimeout(timeoutId);
    console.log(`[Chat] ✓ Ollama responded in ${Date.now() - t2}ms`);

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text().catch(() => '');
      console.error('[Ollama] Error:', ollamaRes.status, errText);
      return res.status(502).json({ error: `Ollama error (${ollamaRes.status}): ${errText || 'Make sure Ollama is running'}` });
    }

    const ollamaData = await ollamaRes.json();
    const aiReply    = ollamaData?.message?.content;

    if (!aiReply) return res.status(502).json({ error: 'Empty response from Ollama. Please try again.' });

    addToSessionHistory(sessionId, 'user', message.trim());
    addToSessionHistory(sessionId, 'assistant', aiReply);
    persistHistoryAsync(userId, sessionId);

    console.log(`[Chat] ✓ Total: ${Date.now() - t0}ms — reply: "${aiReply.slice(0, 50)}..."`);
    res.json({ success: true, reply: aiReply, sessionId });

  } catch (err) {
    console.error('[Ollama] Chat error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

// ── GET /api/gemini/history ───────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const query = { user: req.userId };
    if (sessionId) query.sessionId = sessionId;
    const sessions = await ChatHistory.find(query).sort({ lastActivity: -1 }).limit(10)
      .select('sessionId messages lastActivity createdAt').lean();
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Ollama] Get history error:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

// ── DELETE /api/gemini/history ────────────────────────────────────────────────
const clearHistory = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const query = { user: req.userId };
    if (sessionId) { sessionCache.delete(sessionId); query.sessionId = sessionId; }
    await ChatHistory.deleteMany(query);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    console.error('[Ollama] Clear history error:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
};

module.exports = { chat, getHistory, clearHistory };
