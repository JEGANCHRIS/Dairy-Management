const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema({
  paymentMethods: [{
    name: String,
    isActive: Boolean,
    credentials: mongoose.Schema.Types.Mixed
  }],
  currency: {
    type: String,
    default: 'INR'
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shippingRates: [{
    name: String,
    price: Number
  }],
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PaymentConfig', paymentConfigSchema);