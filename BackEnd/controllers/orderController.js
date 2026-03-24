const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");

// Create new order
const createOrder = async (req, res) => {
  try {
    const {
      products,
      shippingAddress,
      paymentMethod,
      deliveryType,
      deliveryCharge,
      notes,
    } = req.body;
    const userId = req.userId;

    console.log("📦 Create Order - req.userId:", userId);
    console.log("📦 Create Order - products:", products);
    console.log("📦 Create Order - paymentMethod:", paymentMethod);

    // Validate required fields
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products are required" });
    }

    if (
      !shippingAddress ||
      !shippingAddress.street ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.zipCode
    ) {
      return res
        .status(400)
        .json({ error: "Complete shipping address is required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ error: "Payment method is required" });
    }

    // Calculate total amount and verify stock
    let totalAmount = 0;
    const orderProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        });
      }

      totalAmount += product.price * item.quantity;

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      // Update stock
      product.stock -= item.quantity;
      await product.save();
    }

    // Add delivery charge to total
    const finalTotal = totalAmount + (deliveryCharge || 0);

    // Create order
    const order = new Order({
      user: userId,
      products: orderProducts,
      totalAmount: finalTotal,
      shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "processing",
      deliveryType: deliveryType || "standard",
      deliveryCharge: deliveryCharge || 0,
      notes,
    });

    await order.save();

    console.log("✅ Order created - order._id:", order._id);
    console.log("✅ Order created - order.user:", order.user);

    // Update user's purchase history
    await User.findByIdAndUpdate(userId, {
      $push: { purchaseHistory: order._id },
      $inc: { totalSpent: finalTotal },
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ error: "Error creating order" });
  }
};

// Get user's orders
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId })
      .populate("products.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get my orders error:", error);
    res.status(500).json({ error: "Error fetching orders" });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("products.product")
      .populate("user", "name email");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if user owns the order or is admin/manager
    if (
      order.user._id.toString() !== req.userId &&
      !["admin", "superAdmin", "manager"].includes(req.userRole)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ error: "Error fetching order" });
  }
};

// Get all orders (Admin/Manager only)
const getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    });
  } catch (error) {
    console.error("Get all orders error:", error);
    res.status(500).json({ error: "Error fetching orders" });
  }
};

// Update order status (Admin/Manager only)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, paymentStatus } = req.body;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;

    await order.save();

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ error: "Error updating order" });
  }
};

// Cancel order (User or Admin)
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if user owns the order or is admin
    if (
      order.user.toString() !== req.userId &&
      !["admin", "superAdmin"].includes(req.userRole)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if order can be cancelled
    if (!["processing", "pending"].includes(order.orderStatus)) {
      return res.status(400).json({
        error: `Order cannot be cancelled. Current status: ${order.orderStatus}`,
      });
    }

    // Store the order total before cancelling
    const orderTotal = order.totalAmount;

    order.orderStatus = "cancelled";
    await order.save();

    // Update user's totalSpent - subtract the cancelled order amount
    await User.findByIdAndUpdate(order.user, {
      $inc: { totalSpent: -orderTotal },
    });

    // Restore product stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    res.json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ error: "Error cancelling order" });
  }
};

// Get order statistics (Admin/Manager only)
const getOrderStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const completedOrders = await Order.countDocuments({
      orderStatus: "delivered",
    });
    const pendingOrders = await Order.countDocuments({
      orderStatus: "processing",
    });
    const cancelledOrders = await Order.countDocuments({
      orderStatus: "cancelled",
    });

    const revenue = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const monthlyStats = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      totalOrders,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalRevenue: revenue[0]?.total || 0,
      monthlyStats,
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({ error: "Error fetching order statistics" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
};
