const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  // Who initiated the action
  initiatedBy: {
    type: String,
    enum: ['ai_admin_bot', 'superAdmin', 'admin'],
    required: true,
    default: 'ai_admin_bot'
  },

  // Parsed intent from NLP
  intent: {
    type: String,
    enum: [
      'update_price', 'restock_product', 'deactivate_product', 'delete_product',
      'apply_discount', 'update_order_status', 'cancel_order', 'flag_order',
      'change_user_role', 'deactivate_user', 'publish_blog', 'send_email',
      'get_analytics', 'unknown'
    ],
    required: true
  },

  // Original command text
  rawCommand: { type: String, required: true },

  // Entities extracted from the command
  entities: {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    orderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    value:     { type: mongoose.Schema.Types.Mixed }, // price, discount %, etc.
    extra:     { type: mongoose.Schema.Types.Mixed }
  },

  // ML confidence score (0-1)
  confidence: { type: Number, min: 0, max: 1, required: true },

  // Decision made by the engine
  decision: {
    type: String,
    enum: ['auto_executed', 'pending_sa_approval', 'denied', 'sa_approved', 'sa_rejected'],
    required: true
  },

  // Human-readable reason for the decision
  decisionReason: { type: String },

  // Outcome details
  outcome: {
    success:  { type: Boolean },
    message:  { type: String },
    data:     { type: mongoose.Schema.Types.Mixed }
  },

  // SuperAdmin approval reference
  pendingApprovalId: { type: mongoose.Schema.Types.ObjectId, ref: 'PendingApproval' },

  // SuperAdmin who approved/rejected (if applicable)
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date }

}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ intent: 1, createdAt: -1 });
auditLogSchema.index({ decision: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
