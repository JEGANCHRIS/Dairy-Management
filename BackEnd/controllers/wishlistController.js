const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// Get or create wishlist for user
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId }).populate(
    "items.product",
  );

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
    wishlist = await Wishlist.findById(wishlist._id).populate("items.product");
  }

  return wishlist;
};

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.userId);
    res.json({
      success: true,
      items: wishlist.items,
      count: wishlist.items.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ error: "Error fetching wishlist" });
  }
};

// Add product to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const wishlist = await getOrCreateWishlist(req.userId);

    // Check if already in wishlist
    if (wishlist.isProductInWishlist(productId)) {
      return res.status(400).json({ error: "Product already in wishlist" });
    }

    await wishlist.addProduct(productId);
    const updatedWishlist = await Wishlist.findById(wishlist._id).populate(
      "items.product",
    );

    res.json({
      success: true,
      message: "Product added to wishlist",
      items: updatedWishlist.items,
      count: updatedWishlist.items.length,
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ error: "Error adding to wishlist" });
  }
};

// Remove product from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const wishlist = await getOrCreateWishlist(req.userId);

    // Remove product (filter out matching product)
    await wishlist.removeProduct(productId);

    const updatedWishlist = await Wishlist.findById(wishlist._id).populate(
      "items.product",
    );

    res.json({
      success: true,
      message: "Product removed from wishlist",
      items: updatedWishlist.items,
      count: updatedWishlist.items.length,
    });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ error: "Error removing from wishlist" });
  }
};

// Check if product is in wishlist
const checkWishlistStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const wishlist = await getOrCreateWishlist(req.userId);
    const isInWishlist = wishlist.isProductInWishlist(productId);

    res.json({
      success: true,
      isInWishlist,
    });
  } catch (error) {
    console.error("Error checking wishlist status:", error);
    res.status(500).json({ error: "Error checking wishlist status" });
  }
};

// Get wishlist count
const getWishlistCount = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.userId);
    res.json({
      success: true,
      count: wishlist.items.length,
    });
  } catch (error) {
    console.error("Error fetching wishlist count:", error);
    res.status(500).json({ error: "Error fetching wishlist count" });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  getWishlistCount,
};
