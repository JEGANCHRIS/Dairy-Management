const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  resetPassword
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Add logging to all routes
router.use((req, res, next) => {
  console.log('🔔 Auth Route:', req.method, req.path);
  next();
});

// Public routes
router.get('/test', (req, res) => {
  res.json({
    message: 'Auth router is working!',
    time: new Date().toISOString()
  });
});

// TEMPORARY: Fix password for testing
router.post('/fix-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    const bcrypt = require('bcrypt');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    await User.updateOne(
      { email: email.toLowerCase() },
      { $set: { password: hashedPassword } }
    );
    
    res.json({ success: true, message: 'Password fixed!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', login);
router.post('/register', register);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;