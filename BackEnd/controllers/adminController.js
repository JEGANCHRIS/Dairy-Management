const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Blog = require('../models/Blog');

// Login as user (SuperAdmin only)
const loginAsUser = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User is inactive'
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login as user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });

    // Product stats
    const totalProducts = await Product.countDocuments();
    
    // Calculate total stock across all products
    const stockAggregate = await Product.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: '$stock' }
        }
      }
    ]);
    const totalStock = stockAggregate[0]?.totalStock || 0;
    
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'processing' });
    const completedOrders = await Order.countDocuments({ orderStatus: 'delivered' });

    // Revenue stats
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
          paymentStatus: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const monthlyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          paymentStatus: 'completed'
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      users: {
        total: totalUsers,
        newToday: newUsersToday
      },
      products: {
        total: totalProducts,
        totalStock: totalStock,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders
      },
      revenue: {
        today: todayRevenue[0]?.total || 0,
        thisMonth: monthlyRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ error: 'Error fetching dashboard stats' });
  }
};

// Get user analytics
const getUserAnalytics = async (req, res) => {
  try {
    // User growth over time
    const userGrowth = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]);

    // User distribution by role
    const userByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Top spenders
    const topSpenders = await User.find()
      .sort({ totalSpent: -1 })
      .limit(10)
      .select('name email totalSpent purchaseHistory');

    res.json({
      userGrowth,
      userByRole,
      topSpenders
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Error fetching user analytics' });
  }
};

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    // Most sold products
    const mostSold = await Order.aggregate([
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalSold: { $sum: '$products.quantity' },
          revenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      }
    ]);

    // Products by category with avg price
    const productsByCategory = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } }
    ]);

    // All products with price for price chart
    const allProducts = await Product.find({ isActive: { $ne: false } })
      .select('name category price stock variety')
      .sort({ price: -1 })
      .limit(20)
      .lean();

    // Stock status
    const stockStatus = {
      inStock: await Product.countDocuments({ stock: { $gt: 10 } }),
      lowStock: await Product.countDocuments({ stock: { $gte: 1, $lte: 10 } }),
      outOfStock: await Product.countDocuments({ stock: 0 })
    };

    res.json({
      mostSold,
      productsByCategory,
      allProducts,
      stockStatus
    });
  } catch (error) {
    console.error('Get product analytics error:', error);
    res.status(500).json({ error: 'Error fetching product analytics' });
  }
};

// Get sales analytics
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let groupBy;
    switch (period) {
      case 'day':
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        };
        break;
      case 'week':
        groupBy = {
          year: { $year: '$createdAt' },
          week: { $week: '$createdAt' }
        };
        break;
      case 'month':
      default:
        groupBy = {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: new Date(new Date().setFullYear(new Date().getFullYear() - 1)) }
        }
      },
      {
        $group: {
          _id: groupBy,
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
    ]);

    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalRevenueData = await Order.aggregate([
      { $match: { paymentStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, avg: { $avg: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      salesData,
      paymentMethods,
      summary: {
        totalRevenue: totalRevenueData[0]?.total || 0,
        averageOrderValue: totalRevenueData[0]?.avg || 0,
        totalOrders: totalRevenueData[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    res.status(500).json({ error: 'Error fetching sales analytics' });
  }
};

// Manage user (activate/deactivate, change role)
const manageUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    // Prevent superAdmin from being modified by non-superAdmin
    const targetUser = await User.findById(id);
    if (targetUser.role === 'superAdmin' && req.userRole !== 'superAdmin') {
      return res.status(403).json({ error: 'Cannot modify superAdmin' });
    }

    const updates = {};
    if (isActive !== undefined) updates.isActive = isActive;
    if (role !== undefined && req.userRole === 'superAdmin') updates.role = role;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-password');

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Manage user error:', error);
    res.status(500).json({ error: 'Error managing user' });
  }
};

// Get all users with pagination
const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const role = req.query.role;
    const search = req.query.search;

    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

// Get user details by ID
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate({
        path: 'purchaseHistory',
        populate: { path: 'products.product' }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Error fetching user details' });
  }
};

// Create new user (SuperAdmin only)
const createUser = async (req, res) => {
  try {
    const userData = req.body;

    console.log('👤 Creating new user:', userData.email, userData.name);
    console.log('🔑 Password received:', userData.password, 'Length:', userData.password?.length);

    // Check if email already exists
    const existingUser = await User.findOne({ email: userData.email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Create user - the User model's pre-save hook will hash the password
    const user = new User({
      name: userData.name,
      email: userData.email.trim().toLowerCase(),
      password: userData.password, // Pass plain text password - model will hash it
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      phoneNumber: userData.phoneNumber,
      address: userData.address
    });

    console.log('🔐 Before save - Password:', user.password, 'Length:', user.password?.length);
    
    await user.save();

    console.log('✅ User created successfully:', user.email, user.role);
    console.log('🔐 After save - Hash starts with:', user.password?.substring(0, 30));

    res.status(201).json({
      message: 'User created successfully',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Create user error:', error);

    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    res.status(500).json({ error: 'Error creating user' });
  }
};

// Update user (SuperAdmin only)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Prevent password update through this route
    delete updates.password;

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
};

// Delete user (SuperAdmin only)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting superAdmin
    const user = await User.findById(id);
    if (user.role === 'superAdmin') {
      return res.status(403).json({ error: 'Cannot delete superAdmin' });
    }

    await User.findByIdAndDelete(id);

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Error deleting user' });
  }
};

// Get audit logs (SuperAdmin only)
const getAuditLogs = async (req, res) => {
  try {
    // This would typically come from a separate AuditLog model
    // For now, return recent significant events
    const recentOrders = await Order.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(20);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('name email role createdAt');

    res.json({
      recentOrders,
      recentUsers
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Error fetching audit logs' });
  }
};

// Get system health (SuperAdmin only)
const getSystemHealth = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Get system stats
    const stats = {
      database: dbStatus,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeUsers: await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 24*60*60*1000) } }),
      totalRequests: 0, // This would need a request counter middleware
      averageResponseTime: 0 // This would need monitoring middleware
    };

    res.json(stats);
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({ error: 'Error fetching system health' });
  }
};

module.exports = {
  getDashboardStats,
  getUserAnalytics,
  getProductAnalytics,
  getSalesAnalytics,
  manageUser,
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs,
  getSystemHealth,
  loginAsUser
};