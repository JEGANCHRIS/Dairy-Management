const Product = require("../models/Product");

// Get all products with pagination
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const showAll = req.query.showAll === "true"; // admins can pass showAll=true

    // Only show active products unless admin requests all
    const filter = showAll ? {} : { isActive: { $ne: false } };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    console.error("Get products error:", error);
    // Return empty data if MongoDB is not connected
    res.json({
      products: [],
      currentPage: 1,
      totalPages: 0,
      totalProducts: 0,
      message: "Database not connected - no products available",
    });
  }
};

// Get single product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ error: "Error fetching product" });
  }
};

// Get latest products (for slider)
const getLatestProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;

    const products = await Product.find().sort({ createdAt: -1 }).limit(limit);

    res.json(products);
  } catch (error) {
    console.error("Get latest products error:", error);
    // Return empty data if MongoDB is not connected
    res.json([]);
  }
};

// Get all categories with their varieties
const getCategories = async (req, res) => {
  try {
    const products = await Product.find().select("category variety");

    const categories = {};

    products.forEach((product) => {
      if (!categories[product.category]) {
        categories[product.category] = new Set();
      }
      categories[product.category].add(product.variety);
    });

    // Convert Sets to Arrays
    Object.keys(categories).forEach((key) => {
      categories[key] = Array.from(categories[key]);
    });

    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Error fetching categories" });
  }
};

// Filter products by category and variety
const filterProducts = async (req, res) => {
  try {
    const { category, variety } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (variety) filter.variety = variety;

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Filter products error:", error);
    res.status(500).json({ error: "Error filtering products" });
  }
};

// Search products by name
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json([]);
    }

    const products = await Product.find({
      name: { $regex: q, $options: "i" },
    }).limit(20);

    res.json(products);
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ error: "Error searching products" });
  }
};

// Create new product (Admin/SuperAdmin only)
const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create product error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation Error",
        details: Object.values(error.errors).map((e) => e.message),
      });
    }

    res.status(500).json({ error: "Error creating product" });
  }
};

// Update product (Admin/SuperAdmin only)
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    console.log("Updating product:", id);
    console.log("Updates:", updates);

    updates.updatedAt = Date.now();

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log("Product updated successfully:", product._id);
    res.json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update product error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      console.error("Validation errors:", messages);
      return res.status(400).json({
        error: "Validation Error",
        details: messages,
      });
    }

    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    res.status(500).json({ error: "Error updating product: " + error.message });
  }
};

// Delete product (Admin/SuperAdmin only)
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ error: "Error deleting product" });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getLatestProducts,
  getCategories,
  filterProducts,
  searchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
