const PaymentConfig = require("../models/PaymentConfig");
const Order = require("../models/Order");

// Get payment configuration
const getPaymentConfig = async (req, res) => {
  try {
    let config = await PaymentConfig.findOne();

    if (!config) {
      // Create default config if none exists
      config = new PaymentConfig({
        paymentMethods: [
          { name: "Credit Card", isActive: true },
          { name: "Debit Card", isActive: true },
          { name: "Net Banking", isActive: true },
          { name: "UPI", isActive: true },
          { name: "Cash on Delivery", isActive: true },
        ],
        currency: "INR",
        taxRate: 18,
        shippingRates: [
          { name: "Standard Delivery", price: 50 },
          { name: "Express Delivery", price: 100 },
        ],
      });
      await config.save();
    }

    res.json(config);
  } catch (error) {
    console.error("Get payment config error:", error);
    res.status(500).json({ error: "Error fetching payment configuration" });
  }
};

// Update payment configuration (SuperAdmin only)
const updatePaymentConfig = async (req, res) => {
  try {
    const updates = req.body;
    updates.updatedBy = req.userId;
    updates.updatedAt = Date.now();

    let config = await PaymentConfig.findOne();

    if (!config) {
      config = new PaymentConfig(updates);
    } else {
      Object.assign(config, updates);
    }

    await config.save();

    res.json({
      message: "Payment configuration updated successfully",
      config,
    });
  } catch (error) {
    console.error("Update payment config error:", error);
    res.status(500).json({ error: "Error updating payment configuration" });
  }
};

// Get active payment methods
const getPaymentMethods = async (req, res) => {
  try {
    const config = await PaymentConfig.findOne();

    if (!config) {
      return res.json({
        paymentMethods: [
          { name: "Credit Card", isActive: true },
          { name: "Debit Card", isActive: true },
          { name: "Net Banking", isActive: true },
          { name: "UPI", isActive: true },
          { name: "Cash on Delivery", isActive: true },
        ],
      });
    }

    const activeMethods = config.paymentMethods.filter((m) => m.isActive);
    res.json({ paymentMethods: activeMethods });
  } catch (error) {
    console.error("Get payment methods error:", error);
    res.status(500).json({ error: "Error fetching payment methods" });
  }
};

// Process payment
const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    console.log("🔍 Process Payment - orderId:", orderId);
    console.log("🔍 Process Payment - req.userId:", req.userId);

    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      console.error("❌ Order not found:", orderId);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log("🔍 Process Payment - order.user:", order.user);
    console.log("🔍 Process Payment - order.user._id:", order.user._id);
    console.log(
      "🔍 Process Payment - order.user._id.toString():",
      order.user._id.toString(),
    );

    // Check if user owns the order
    if (order.user._id.toString() !== req.userId) {
      console.error(
        "❌ Access denied - order.user:",
        order.user._id.toString(),
        "req.userId:",
        req.userId,
      );
      return res.status(403).json({ error: "Access denied" });
    }

    // Simulate payment processing
    // In production, integrate with actual payment gateway
    const paymentResult = {
      success: true,
      transactionId: "TXN" + Date.now(),
      amount: order.totalAmount,
      paymentMethod,
      status: "completed",
      timestamp: new Date(),
    };

    // Update order payment status
    order.paymentStatus = "completed";
    order.paymentDetails = paymentResult;
    await order.save();

    console.log("✅ Payment processed successfully for order:", orderId);

    res.json({
      message: "Payment processed successfully",
      paymentResult,
    });
  } catch (error) {
    console.error("Process payment error:", error);
    res.status(500).json({ error: "Error processing payment" });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;

    // In production, verify with payment gateway
    const order = await Order.findOne({
      "paymentDetails.transactionId": transactionId,
    });

    if (!order) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    res.json({
      verified: true,
      orderId: order._id,
      amount: order.totalAmount,
      status: order.paymentStatus,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({ error: "Error verifying payment" });
  }
};

// Add payment method (SuperAdmin only)
const addPaymentMethod = async (req, res) => {
  try {
    const { name, credentials } = req.body;

    let config = await PaymentConfig.findOne();

    if (!config) {
      config = new PaymentConfig();
    }

    // Check if method already exists
    const existingMethod = config.paymentMethods.find((m) => m.name === name);
    if (existingMethod) {
      return res.status(400).json({ error: "Payment method already exists" });
    }

    config.paymentMethods.push({
      name,
      isActive: true,
      credentials,
    });

    config.updatedBy = req.userId;
    config.updatedAt = Date.now();

    await config.save();

    res.status(201).json({
      message: "Payment method added successfully",
      paymentMethods: config.paymentMethods,
    });
  } catch (error) {
    console.error("Add payment method error:", error);
    res.status(500).json({ error: "Error adding payment method" });
  }
};

// Remove payment method (SuperAdmin only)
const removePaymentMethod = async (req, res) => {
  try {
    const { methodId } = req.params;

    const config = await PaymentConfig.findOne();

    if (!config) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    config.paymentMethods = config.paymentMethods.filter(
      (m) => m._id.toString() !== methodId,
    );

    config.updatedBy = req.userId;
    config.updatedAt = Date.now();

    await config.save();

    res.json({
      message: "Payment method removed successfully",
      paymentMethods: config.paymentMethods,
    });
  } catch (error) {
    console.error("Remove payment method error:", error);
    res.status(500).json({ error: "Error removing payment method" });
  }
};

// Get transaction history for user
const getTransactionHistory = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.userId,
      paymentStatus: "completed",
    })
      .select("_id totalAmount paymentMethod paymentDetails createdAt")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get transaction history error:", error);
    res.status(500).json({ error: "Error fetching transaction history" });
  }
};

module.exports = {
  getPaymentConfig,
  updatePaymentConfig,
  processPayment,
  verifyPayment,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  getTransactionHistory,
};
