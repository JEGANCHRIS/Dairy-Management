const mongoose = require('mongoose');

const pendingApprovalSchema = new mongoose.Schema({
  // The original audit log entry
  auditLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'AuditLog', required: true },

  // Intent & command
  intent:     { type: String, required: true },
  rawCommand: { type: String, required: true },

  // What the bot wants to do — a clear plain-English description
  actionSummary: { type: String, required: true },

  // Predicted impact details shown to SuperAdmin
  impact: {
    description:    { type: String },
    affectedEntity: { type: String }, // e.g. "Product: Fresh Milk"
    currentValue:   { type: mongoose.Schema.Types.Mixed },
    proposedValue:  { type: mongoose.Schema.Types.Mixed },
    riskLevel:      { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' }
  },

  // ML confidence score
  confidence: { type: Number },

  // Extracted entities needed to execute after approval
  payload: { type: mongoose.Schema.Types.Mixed },

  // Approval status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },

  // SuperAdmin's response
  reviewedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt:   { type: Date },
  reviewNote:   { type: String }, // SA can add a note when approving/rejecting

  // Auto-expire after 24 hours if no response
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000)
  }

}, { timestamps: true });

pendingApprovalSchema.index({ status: 1, createdAt: -1 });
pendingApprovalSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingApproval', pendingApprovalSchema);
