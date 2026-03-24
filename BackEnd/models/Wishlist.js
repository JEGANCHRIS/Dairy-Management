const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // This creates an index automatically
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Index for faster queries on items.product
wishlistSchema.index({ "items.product": 1 });

// Method to check if product is in wishlist
wishlistSchema.methods.isProductInWishlist = function (productId) {
  return this.items.some(
    (item) => item.product.toString() === productId.toString(),
  );
};

// Method to add product to wishlist
wishlistSchema.methods.addProduct = function (productId) {
  if (!this.isProductInWishlist(productId)) {
    this.items.push({ product: productId });
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove product from wishlist
wishlistSchema.methods.removeProduct = function (productId) {
  const productIdStr = productId.toString();
  this.items = this.items.filter((item) => {
    // Handle both populated and non-populated products
    const itemProductId = item.product._id
      ? item.product._id.toString()
      : item.product.toString();
    return itemProductId !== productIdStr;
  });
  return this.save();
};

module.exports = mongoose.model("Wishlist", wishlistSchema);
