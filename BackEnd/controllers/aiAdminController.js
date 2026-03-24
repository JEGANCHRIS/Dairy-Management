/**
 * AI Admin Controller
 * 
 * Flow:
 * 1. Receive plain-English admin command
 * 2. NLP: classify intent + extract entities (via Ollama / keyword fallback)
 * 3. RAG: fetch live MongoDB context for that intent
 * 4. ML: call Python microservice for confidence score & predictions
 * 5. Decision engine: auto-execute | SA gate | deny
 * 6. Execute or queue, write AuditLog
 */

const Product        = require('../models/Product');
const Order          = require('../models/Order');
const User           = require('../models/User');
const Blog           = require('../models/Blog');
const AuditLog       = require('../models/AuditLog');
const PendingApproval = require('../models/PendingApproval');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const OLLAMA_URL     = process.env.OLLAMA_URL      || 'http://localhost:11434';
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL    || 'llama3.2';

// ─────────────────────────────────────────────────────────────
// INTENT DEFINITIONS
// Each entry defines: keywords to detect it, risk level, whether
// it needs SA approval, confidence threshold for auto-execute.
// ─────────────────────────────────────────────────────────────
const INTENT_CONFIG = {
  update_price: {
    keywords: ['price', 'cost', 'rate', 'set price', 'change price', 'update price'],
    risk: 'medium',
    autoThreshold: 0.70,    // keyword hit gives 0.72; ML boosts further in prod
    maxAutoChange: 0.10,
    needsSA: false
  },
  restock_product: {
    keywords: ['restock', 'refill', 'add stock', 'replenish', 'top up', 'update stock'],
    risk: 'low',
    autoThreshold: 0.60,
    needsSA: false
  },
  deactivate_product: {
    keywords: ['deactivate', 'disable product', 'hide product', 'remove product from store'],
    risk: 'high',
    autoThreshold: 1.1,     // > 1 means ALWAYS needs SA
    needsSA: true
  },
  delete_product: {
    keywords: ['delete product', 'remove product', 'destroy product'],
    risk: 'critical',
    autoThreshold: 1.1,
    needsSA: true
  },
  apply_discount: {
    keywords: ['discount', 'sale', 'offer', 'promo', 'reduce by', 'markdown'],
    risk: 'medium',
    autoThreshold: 0.72,
    maxAutoDiscount: 15,
    needsSA: false
  },
  update_order_status: {
    keywords: ['ship', 'shipped', 'deliver', 'mark order', 'order status', 'processing order', 'complete order'],
    risk: 'low',
    autoThreshold: 0.65,
    needsSA: false
  },
  cancel_order: {
    keywords: ['cancel order', 'refund', 'reverse order', 'reject order'],
    risk: 'high',
    autoThreshold: 1.1,
    needsSA: true
  },
  flag_order: {
    keywords: ['flag', 'suspicious', 'fraud', 'hold order', 'review order'],
    risk: 'medium',
    autoThreshold: 0.60,
    needsSA: false
  },
  change_user_role: {
    keywords: ['make admin', 'change role', 'promote user', 'demote', 'assign role', 'role to'],
    risk: 'critical',
    autoThreshold: 1.1,
    needsSA: true
  },
  deactivate_user: {
    keywords: ['ban user', 'deactivate user', 'disable account', 'block user', 'suspend user'],
    risk: 'high',
    autoThreshold: 1.1,
    needsSA: true
  },
  publish_blog: {
    keywords: ['publish blog', 'post blog', 'create blog', 'blog post', 'new article'],
    risk: 'low',
    autoThreshold: 0.60,
    needsSA: false
  },
  send_email: {
    keywords: ['send email', 'email all', 'notify users', 'mass email', 'promotional email', 'announcement'],
    risk: 'high',
    autoThreshold: 1.1,
    needsSA: true
  },
  get_analytics: {
    keywords: ['show stats', 'analytics', 'report', 'dashboard', 'revenue', 'top products', 'sales data', 'how many orders'],
    risk: 'none',
    autoThreshold: 0.50,
    needsSA: false
  }
};

// BLOCKED intents — bot never touches these
const BLOCKED_PATTERNS = [
  'delete user', 'remove user data', 'payment config', 'payment credentials',
  'change password', 'api key', 'env', 'environment variable', 'server config'
];

// ─────────────────────────────────────────────────────────────
// 1. NLP — Intent Classification
// Uses keyword matching first (fast & reliable for known intents),
// then falls back to Ollama for ambiguous commands.
// ─────────────────────────────────────────────────────────────
async function classifyIntent(command) {
  const lower = command.toLowerCase();

  // Hard block check first
  for (const pattern of BLOCKED_PATTERNS) {
    if (lower.includes(pattern)) {
      return { intent: 'blocked', confidence: 1.0, entities: {} };
    }
  }

  // Keyword matching — use any-match scoring (1 keyword hit is enough to route)
  let bestIntent = 'unknown';
  let bestScore  = 0;
  for (const [intent, cfg] of Object.entries(INTENT_CONFIG)) {
    const matches = cfg.keywords.filter(kw => lower.includes(kw)).length;
    if (matches > bestScore) { bestScore = matches; bestIntent = intent; }
  }

  // If at least 1 keyword matched, use it
  if (bestScore >= 1) {
    const entities = extractEntities(command, bestIntent);
    // Base: 0.72 + 0.05 per extra match hit — 1 kw = 0.77, 2 = 0.82, 3 = 0.85
    return { intent: bestIntent, confidence: Math.min(0.85, 0.72 + (bestScore - 1) * 0.05), entities };
  }

  // Fallback: ask Ollama to classify
  try {
    const prompt = `You are an intent classifier for a dairy e-commerce admin bot.
Classify the following admin command into exactly ONE of these intents:
update_price, restock_product, deactivate_product, delete_product, apply_discount,
update_order_status, cancel_order, flag_order, change_user_role, deactivate_user,
publish_blog, send_email, get_analytics, unknown

Also extract any relevant entities: product name, order id, user id, numeric value, percentage.

Command: "${command}"

Respond ONLY with valid JSON in this exact format:
{"intent":"<intent>","confidence":<0.0-1.0>,"entities":{"productName":"<or null>","orderId":"<or null>","userId":"<or null>","value":<number or null>,"percentage":<number or null>}}`;

    const res  = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { temperature: 0.1, num_predict: 200 }
      }),
      signal: AbortSignal.timeout(15000)
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.message?.content || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.intent && INTENT_CONFIG[parsed.intent]) {
          return {
            intent:     parsed.intent,
            confidence: parseFloat(parsed.confidence) || 0.6,
            entities:   { ...extractEntities(command, parsed.intent), ...parsed.entities }
          };
        }
      }
    }
  } catch (err) {
    console.warn('[AIAdmin] Ollama classify failed, using keyword result:', err.message);
  }

  return {
    intent:     bestIntent,
    confidence: bestScore > 0 ? Math.min(0.65, 0.4 + bestScore) : 0.3,
    entities:   extractEntities(command, bestIntent)
  };
}

// Simple entity extractor — pulls numbers, percentages, IDs from command text
function extractEntities(command, intent) {
  const entities = {};

  // Extract numbers
  const numbers = command.match(/\d+(\.\d+)?/g);
  if (numbers) {
    entities.value = parseFloat(numbers[0]);
    if (numbers.length > 1) entities.secondValue = parseFloat(numbers[1]);
  }

  // Extract percentage
  const pctMatch = command.match(/(\d+(\.\d+)?)\s*%/);
  if (pctMatch) entities.percentage = parseFloat(pctMatch[1]);

  // Extract status for order updates
  const statuses = ['shipped', 'delivered', 'processing', 'cancelled'];
  for (const s of statuses) {
    if (command.toLowerCase().includes(s)) { entities.status = s; break; }
  }

  // Extract role changes
  const roles = ['admin', 'manager', 'user'];
  for (const r of roles) {
    if (command.toLowerCase().includes(r)) { entities.role = r; break; }
  }

  return entities;
}

// ─────────────────────────────────────────────────────────────
// 2. RAG — Fetch live MongoDB context for the detected intent
// ─────────────────────────────────────────────────────────────
async function fetchContext(intent, entities, command) {
  const ctx = {};
  const lower = command.toLowerCase();

  try {
    if (['update_price', 'restock_product', 'deactivate_product', 'delete_product', 'apply_discount'].includes(intent)) {
      // Try to find the specific product mentioned
      const nameWords = lower.replace(/[^a-z\s]/g, '').split(' ')
        .filter(w => w.length > 3 && !['with', 'price', 'stock', 'product', 'discount', 'apply', 'update', 'change', 'set'].includes(w));

      let product = null;
      for (const word of nameWords) {
        product = await Product.findOne({
          name: { $regex: word, $options: 'i' },
          isActive: true
        }).lean();
        if (product) break;
      }

      if (!product) {
        // Fallback: return all products for context
        ctx.products = await Product.find({ isActive: true })
          .select('name category price stock discount isActive')
          .limit(20).lean();
      } else {
        ctx.targetProduct = product;
      }
    }

    if (['update_order_status', 'cancel_order', 'flag_order'].includes(intent)) {
      ctx.recentOrders = await Order.find({ orderStatus: { $in: ['processing', 'shipped'] } })
        .populate('user', 'name email')
        .populate('products.product', 'name')
        .sort({ createdAt: -1 }).limit(10).lean();
    }

    if (['change_user_role', 'deactivate_user'].includes(intent)) {
      ctx.users = await User.find({ isActive: true, role: { $ne: 'superAdmin' } })
        .select('name email role isActive lastLogin').limit(20).lean();
    }

    if (intent === 'get_analytics') {
      const [orders, products, users] = await Promise.all([
        Order.aggregate([
          { $group: { _id: '$orderStatus', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
        ]),
        Product.find({ isActive: true }).select('name category price stock').sort({ stock: 1 }).limit(5).lean(),
        User.countDocuments({ isActive: true })
      ]);
      ctx.analytics = { orders, lowStockProducts: products, activeUsers: users };
    }
  } catch (err) {
    console.error('[AIAdmin] Context fetch error:', err.message);
  }

  return ctx;
}

// ─────────────────────────────────────────────────────────────
// 3. ML — Call Python microservice for enhanced signals
// Falls back gracefully if service is down.
// ─────────────────────────────────────────────────────────────
async function callMLService(intent, context, entities) {
  const result = { mlConfidence: null, mlSignals: {} };
  try {
    const payload = { intent, entities, context_summary: buildContextSummary(context) };
    const res = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const data = await res.json();
      result.mlConfidence = data.confidence;
      result.mlSignals    = data.signals || {};
    }
  } catch (err) {
    console.warn('[AIAdmin] ML service unavailable, using NLP confidence only:', err.message);
  }
  return result;
}

function buildContextSummary(ctx) {
  const parts = [];
  if (ctx.targetProduct) parts.push(`Product: ${ctx.targetProduct.name} price=₹${ctx.targetProduct.price} stock=${ctx.targetProduct.stock}`);
  if (ctx.products)      parts.push(`${ctx.products.length} products in catalog`);
  if (ctx.recentOrders)  parts.push(`${ctx.recentOrders.length} recent orders`);
  if (ctx.analytics)     parts.push(`Analytics: ${ctx.analytics.activeUsers} active users`);
  return parts.join('; ');
}

// ─────────────────────────────────────────────────────────────
// 4. Decision Engine
// Combines NLP confidence + ML signals → auto | SA gate | deny
// ─────────────────────────────────────────────────────────────
function makeDecision(intent, nlpConfidence, mlResult, entities) {
  if (intent === 'blocked') return { decision: 'denied', reason: 'This type of action is outside the AI bot\'s scope for security reasons.' };
  if (intent === 'unknown') return { decision: 'denied', reason: 'I could not understand that command. Please be more specific.' };

  const cfg        = INTENT_CONFIG[intent];
  const confidence = mlResult.mlConfidence ?? nlpConfidence;

  // Always-SA intents
  if (cfg.needsSA || cfg.autoThreshold > 1) {
    return { decision: 'pending_sa_approval', reason: `This action (${intent}) requires SuperAdmin approval due to its risk level: ${cfg.risk}.`, confidence };
  }

  // Conditional SA for price changes > 10%
  if (intent === 'update_price' && entities.percentage && entities.percentage > 10) {
    return { decision: 'pending_sa_approval', reason: `Price change of ${entities.percentage}% exceeds the 10% auto-execute threshold.`, confidence };
  }

  // Conditional SA for discounts > 15%
  if (intent === 'apply_discount' && entities.percentage && entities.percentage > 15) {
    return { decision: 'pending_sa_approval', reason: `Discount of ${entities.percentage}% exceeds the 15% auto-execute threshold.`, confidence };
  }

  // Confidence too low
  if (confidence < cfg.autoThreshold) {
    return { decision: 'pending_sa_approval', reason: `Confidence score ${(confidence * 100).toFixed(0)}% is below threshold. Routing to SuperAdmin for safety.`, confidence };
  }

  return { decision: 'auto_executed', reason: `Confidence ${(confidence * 100).toFixed(0)}% meets threshold. Executing automatically.`, confidence };
}

// ─────────────────────────────────────────────────────────────
// 5. Action Executor — actually performs the DB operations
// ─────────────────────────────────────────────────────────────
async function executeAction(intent, entities, context) {
  switch (intent) {

    case 'update_price': {
      const product = context.targetProduct;
      if (!product) return { success: false, message: 'Could not identify which product to update. Please specify the product name.' };
      const newPrice = entities.value || (product.price * (1 + (entities.percentage || 0) / 100));
      if (newPrice <= 0) return { success: false, message: 'Invalid price value.' };
      const updated = await Product.findByIdAndUpdate(product._id, { price: Math.round(newPrice * 100) / 100, updatedAt: Date.now() }, { new: true });
      return { success: true, message: `✅ Price updated: ${product.name} ₹${product.price} → ₹${updated.price}`, data: { productId: product._id, oldPrice: product.price, newPrice: updated.price } };
    }

    case 'restock_product': {
      const product = context.targetProduct;
      if (!product) return { success: false, message: 'Could not identify which product to restock.' };
      const addQty  = entities.value || 50;
      const updated = await Product.findByIdAndUpdate(product._id, { $inc: { stock: addQty }, updatedAt: Date.now() }, { new: true });
      return { success: true, message: `✅ Restocked ${product.name}: ${product.stock} → ${updated.stock} units`, data: { productId: product._id, added: addQty, newStock: updated.stock } };
    }

    case 'deactivate_product': {
      const product = context.targetProduct;
      if (!product) return { success: false, message: 'Product not identified.' };
      await Product.findByIdAndUpdate(product._id, { isActive: false, updatedAt: Date.now() });
      return { success: true, message: `✅ Product "${product.name}" deactivated and hidden from store.`, data: { productId: product._id } };
    }

    case 'delete_product': {
      const product = context.targetProduct;
      if (!product) return { success: false, message: 'Product not identified.' };
      await Product.findByIdAndDelete(product._id);
      return { success: true, message: `✅ Product "${product.name}" permanently deleted.`, data: { productId: product._id } };
    }

    case 'apply_discount': {
      const product  = context.targetProduct;
      if (!product) return { success: false, message: 'Product not identified for discount.' };
      const discount = entities.percentage || entities.value || 10;
      await Product.findByIdAndUpdate(product._id, { discount, updatedAt: Date.now() });
      return { success: true, message: `✅ Applied ${discount}% discount to "${product.name}".`, data: { productId: product._id, discount } };
    }

    case 'update_order_status': {
      const status = entities.status || 'shipped';
      const orders = context.recentOrders || [];
      if (entities.value) {
        // Update a specific order by last digits match
        const order = orders.find(o => String(o._id).endsWith(String(entities.value)));
        if (!order) return { success: false, message: `Order not found.` };
        await Order.findByIdAndUpdate(order._id, { orderStatus: status });
        return { success: true, message: `✅ Order #${String(order._id).slice(-6)} marked as "${status}".`, data: { orderId: order._id, status } };
      }
      // Batch update processing → shipped
      const processingOrders = orders.filter(o => o.orderStatus === 'processing');
      if (!processingOrders.length) return { success: true, message: 'No processing orders to update.' };
      await Order.updateMany({ _id: { $in: processingOrders.map(o => o._id) } }, { orderStatus: status });
      return { success: true, message: `✅ ${processingOrders.length} orders updated to "${status}".`, data: { count: processingOrders.length, status } };
    }

    case 'cancel_order': {
      const orders = context.recentOrders || [];
      const order  = orders[0]; // SA approves, so we take the most recent relevant one
      if (!order) return { success: false, message: 'No order found to cancel.' };
      await Order.findByIdAndUpdate(order._id, { orderStatus: 'cancelled', paymentStatus: 'failed' });
      return { success: true, message: `✅ Order #${String(order._id).slice(-6)} cancelled.`, data: { orderId: order._id } };
    }

    case 'flag_order': {
      const orders = context.recentOrders || [];
      const high   = orders.filter(o => o.totalAmount > 2000);
      if (!high.length) return { success: true, message: 'No high-value orders flagged at this time.' };
      return { success: true, message: `🚩 ${high.length} high-value orders flagged for manual review.`, data: { flagged: high.map(o => String(o._id).slice(-6)) } };
    }

    case 'change_user_role': {
      const users = context.users || [];
      const role  = entities.role || 'manager';
      // SA approves, so we update the first matching user
      if (!users.length) return { success: false, message: 'No user identified for role change.' };
      const target = users[0];
      await User.findByIdAndUpdate(target._id, { role });
      return { success: true, message: `✅ ${target.name}'s role changed to "${role}".`, data: { userId: target._id, role } };
    }

    case 'deactivate_user': {
      const users = context.users || [];
      if (!users.length) return { success: false, message: 'No user identified.' };
      const target = users[0];
      await User.findByIdAndUpdate(target._id, { isActive: false });
      return { success: true, message: `✅ User "${target.name}" account deactivated.`, data: { userId: target._id } };
    }

    case 'publish_blog': {
      // Create a draft blog post (SuperAdmin or admin can publish manually)
      const newBlog = await Blog.create({
        title:      'AI-Generated Post (Review Required)',
        content:    'This post was queued by the AI Admin bot. Please edit and publish.',
        author:     'AI Admin Bot',
        isPublished: false
      });
      return { success: true, message: `✅ Blog post draft created (ID: ${newBlog._id}). Please review and publish.`, data: { blogId: newBlog._id } };
    }

    case 'get_analytics': {
      const analytics = context.analytics || {};
      const summary   = [];
      if (analytics.activeUsers)       summary.push(`👥 Active users: ${analytics.activeUsers}`);
      if (analytics.orders?.length)    summary.push(`📦 Orders: ${analytics.orders.map(o => `${o._id}: ${o.count} (₹${o.revenue?.toFixed(0)})`).join(', ')}`);
      if (analytics.lowStockProducts?.length) summary.push(`⚠️ Low stock: ${analytics.lowStockProducts.map(p => `${p.name} (${p.stock})`).join(', ')}`);
      return { success: true, message: summary.join('\n') || 'No analytics data available.', data: analytics };
    }

    default:
      return { success: false, message: 'Action type not implemented.' };
  }
}

// ─────────────────────────────────────────────────────────────
// Build SuperAdmin notification payload
// ─────────────────────────────────────────────────────────────
function buildImpactSummary(intent, entities, context) {
  const product = context.targetProduct;
  const riskMap = { low: 'low', medium: 'medium', high: 'high', critical: 'critical', none: 'low' };
  const risk    = riskMap[INTENT_CONFIG[intent]?.risk || 'medium'];

  switch (intent) {
    case 'update_price':
      return {
        description:    `Change product price${entities.percentage ? ` by ${entities.percentage}%` : ` to ₹${entities.value}`}`,
        affectedEntity: product ? `Product: ${product.name}` : 'Unknown product',
        currentValue:   product?.price,
        proposedValue:  entities.value || (product ? product.price * (1 + (entities.percentage || 0) / 100) : null),
        riskLevel:      risk
      };
    case 'apply_discount':
      return {
        description:    `Apply ${entities.percentage || entities.value}% discount`,
        affectedEntity: product ? `Product: ${product.name}` : 'Unknown product',
        currentValue:   product?.discount || 0,
        proposedValue:  entities.percentage || entities.value,
        riskLevel:      risk
      };
    case 'cancel_order':
      return {
        description:    'Cancel an order and issue refund',
        affectedEntity: context.recentOrders?.[0] ? `Order #${String(context.recentOrders[0]._id).slice(-6)}` : 'Recent order',
        currentValue:   'active',
        proposedValue:  'cancelled',
        riskLevel:      'high'
      };
    case 'change_user_role':
      return {
        description:    `Promote user to ${entities.role || 'admin'} role`,
        affectedEntity: context.users?.[0]?.name || 'Unknown user',
        currentValue:   context.users?.[0]?.role,
        proposedValue:  entities.role,
        riskLevel:      'critical'
      };
    case 'deactivate_user':
      return {
        description:    'Deactivate a user account',
        affectedEntity: context.users?.[0]?.name || 'Unknown user',
        currentValue:   'active',
        proposedValue:  'inactive',
        riskLevel:      'high'
      };
    case 'deactivate_product':
      return {
        description:    'Hide product from storefront',
        affectedEntity: product ? `Product: ${product.name}` : 'Unknown product',
        currentValue:   'visible',
        proposedValue:  'hidden',
        riskLevel:      'high'
      };
    case 'delete_product':
      return {
        description:    'Permanently delete a product',
        affectedEntity: product ? `Product: ${product.name}` : 'Unknown product',
        currentValue:   'exists',
        proposedValue:  'deleted forever',
        riskLevel:      'critical'
      };
    case 'send_email':
      return {
        description:    'Send mass email / promotional notification to all users',
        affectedEntity: 'All active users',
        currentValue:   null,
        proposedValue:  'email sent',
        riskLevel:      'high'
      };
    default:
      return {
        description:    `Execute: ${intent.replace(/_/g, ' ')}`,
        affectedEntity: 'System',
        currentValue:   null,
        proposedValue:  null,
        riskLevel:      risk
      };
  }
}

// ─────────────────────────────────────────────────────────────
// ROUTE HANDLERS
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin-ai/command
 * Main entry point — receives a natural language admin command
 */
const processCommand = async (req, res) => {
  try {
    const { command } = req.body;
    if (!command?.trim()) return res.status(400).json({ success: false, message: 'Command text is required.' });

    console.log(`\n[AIAdmin] ▶ Command received: "${command}"`);

    // Step 1: NLP — classify intent
    const { intent, confidence: nlpConf, entities } = await classifyIntent(command);
    console.log(`[AIAdmin] Intent: ${intent} (NLP confidence: ${(nlpConf * 100).toFixed(0)}%)`);

    // Step 2: RAG — fetch live context
    const context = await fetchContext(intent, entities, command);

    // Step 3: ML — get enhanced signals
    const mlResult = await callMLService(intent, context, entities);

    // Step 4: Decision
    const { decision, reason, confidence } = makeDecision(intent, nlpConf, mlResult, entities);
    console.log(`[AIAdmin] Decision: ${decision} — ${reason}`);

    // Step 5: Create AuditLog entry
    const auditEntry = await AuditLog.create({
      initiatedBy:  'ai_admin_bot',
      intent,
      rawCommand:   command,
      entities:     { value: entities.value, extra: entities },
      confidence:   confidence || nlpConf,
      decision,
      decisionReason: reason
    });

    // Step 6a: Auto-execute
    if (decision === 'auto_executed') {
      const outcome = await executeAction(intent, entities, context);
      await AuditLog.findByIdAndUpdate(auditEntry._id, { outcome });
      return res.json({ success: true, decision, message: outcome.message, data: outcome.data, auditId: auditEntry._id });
    }

    // Step 6b: Denied
    if (decision === 'denied') {
      await AuditLog.findByIdAndUpdate(auditEntry._id, { outcome: { success: false, message: reason } });
      return res.json({ success: false, decision, message: reason, auditId: auditEntry._id });
    }

    // Step 6c: SA Gate — create pending approval
    if (decision === 'pending_sa_approval') {
      const impact = buildImpactSummary(intent, entities, context);
      const pending = await PendingApproval.create({
        auditLogId:    auditEntry._id,
        intent,
        rawCommand:    command,
        actionSummary: impact.description,
        impact,
        confidence:    confidence || nlpConf,
        payload:       { intent, entities, contextSummary: buildContextSummary(context) }
      });
      await AuditLog.findByIdAndUpdate(auditEntry._id, { pendingApprovalId: pending._id });

      return res.json({
        success:  true,
        decision: 'pending_sa_approval',
        message:  `⏳ Action queued for SuperAdmin approval.\n\nReason: ${reason}\n\nThe SuperAdmin will be notified and can approve or reject this action.`,
        pendingId: pending._id,
        auditId:   auditEntry._id,
        impact
      });
    }

  } catch (err) {
    console.error('[AIAdmin] processCommand error:', err);
    res.status(500).json({ success: false, message: 'Internal error processing command.', error: err.message });
  }
};

/**
 * GET /api/admin-ai/pending
 * SuperAdmin: list all pending approvals
 */
const getPendingApprovals = async (req, res) => {
  try {
    const pending = await PendingApproval.find({ status: 'pending', expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: pending, count: pending.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin-ai/approve/:id
 * SuperAdmin: approve a pending action → executes it
 */
const approveAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const pending = await PendingApproval.findOne({ _id: id, status: 'pending' });
    if (!pending) return res.status(404).json({ success: false, message: 'Pending approval not found or already resolved.' });

    // Re-fetch fresh context for execution
    const { intent, entities } = pending.payload;
    const context = await fetchContext(intent, entities, pending.rawCommand);

    // Execute
    const outcome = await executeAction(intent, entities, context);

    // Update records
    const now = new Date();
    await PendingApproval.findByIdAndUpdate(id, {
      status:     'approved',
      reviewedBy: req.user._id,
      reviewedAt: now,
      reviewNote: note || ''
    });
    await AuditLog.findByIdAndUpdate(pending.auditLogId, {
      decision:   'sa_approved',
      reviewedBy: req.user._id,
      reviewedAt: now,
      outcome
    });

    res.json({ success: true, message: `✅ Action approved and executed.\n${outcome.message}`, data: outcome.data });
  } catch (err) {
    console.error('[AIAdmin] approveAction error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/admin-ai/reject/:id
 * SuperAdmin: reject a pending action
 */
const rejectAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const pending = await PendingApproval.findOne({ _id: id, status: 'pending' });
    if (!pending) return res.status(404).json({ success: false, message: 'Pending approval not found or already resolved.' });

    const now = new Date();
    await PendingApproval.findByIdAndUpdate(id, {
      status:     'rejected',
      reviewedBy: req.user._id,
      reviewedAt: now,
      reviewNote: note || ''
    });
    await AuditLog.findByIdAndUpdate(pending.auditLogId, {
      decision:   'sa_rejected',
      reviewedBy: req.user._id,
      reviewedAt: now,
      outcome:    { success: false, message: `Rejected by SuperAdmin. ${note || ''}` }
    });

    res.json({ success: true, message: '🚫 Action rejected and logged.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin-ai/audit-logs
 * View full audit trail (admin + superAdmin)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, intent, decision } = req.query;
    const filter = {};
    if (intent)   filter.intent   = intent;
    if (decision) filter.decision = decision;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      AuditLog.countDocuments(filter)
    ]);

    res.json({ success: true, data: logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/admin-ai/stats
 * Bot performance stats for the dashboard
 */
const getBotStats = async (req, res) => {
  try {
    const [total, autoExecuted, saApproved, saRejected, denied, pending] = await Promise.all([
      AuditLog.countDocuments(),
      AuditLog.countDocuments({ decision: 'auto_executed' }),
      AuditLog.countDocuments({ decision: 'sa_approved' }),
      AuditLog.countDocuments({ decision: 'sa_rejected' }),
      AuditLog.countDocuments({ decision: 'denied' }),
      PendingApproval.countDocuments({ status: 'pending' })
    ]);

    const topIntents = await AuditLog.aggregate([
      { $group: { _id: '$intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      stats: {
        total, autoExecuted, saApproved, saRejected, denied, pendingCount: pending,
        autonomyRate: total > 0 ? Math.round((autoExecuted / total) * 100) : 0,
        topIntents
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { processCommand, getPendingApprovals, approveAction, rejectAction, getAuditLogs, getBotStats };
