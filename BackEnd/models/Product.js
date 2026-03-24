const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  label:      { type: String, required: true },  // e.g., Small, Medium, Large, XL, XXL
  amount:     { type: Number, required: true },  // e.g., 250, 500, 1
  unit:       { type: String, required: true,    // e.g., ml, L, g, kg, mg
    enum: ['ml', 'L', 'g', 'kg', 'mg', 'pcs'] },
  priceMultiplier: { type: Number, required: true, default: 1 } // multiplier on base price
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['milk', 'butter', 'cheese', 'yogurt', 'paneer', 'lassi', 'milkshake', 'curd', 'cream', 'other']
  },
  variety: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  // Custom sizes defined by admin — replaces hardcoded small/medium/large
  sizes: [sizeSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String,
    required: true
  }],
  videoUrl: {
    type: String
  },
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    fat: Number,
    calcium: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Product', productSchema);