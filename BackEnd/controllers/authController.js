const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRE = "7d";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, address } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      phoneNumber,
      address,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Error registering user" });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trim and lowercase email for consistent lookup
    const normalizedEmail = email.trim().toLowerCase();

    console.log(
      "🔐 Login attempt for:",
      email,
      "-> normalized:",
      normalizedEmail,
    );

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email (exact match since we normalized)
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("❌ User not found with email:", normalizedEmail);
      const allUsers = await User.find({}, "email name role isActive").lean();
      console.log("📋 All users in database:");
      allUsers.forEach((u) => {
        console.log(
          "   -",
          u.email,
          "|",
          u.name,
          "|",
          u.role,
          "| Active:",
          u.isActive,
        );
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log(
      "✅ User found:",
      user.email,
      "| Name:",
      user.name,
      "| Role:",
      user.role,
      "| Active:",
      user.isActive,
    );

    if (!user.isActive) {
      console.log("❌ User account is inactive:", email);
      return res.status(401).json({ error: "Account is deactivated" });
    }

    // Check password
    console.log("🔑 Checking password...");
    console.log("   Input password:", password);
    console.log("   Input password length:", password.length);
    console.log("   Stored hash:", user.password);

    const isPasswordValid = await user.comparePassword(password);
    console.log("🔑 Password valid:", isPasswordValid);
    console.log(
      "🔑 Stored password hash starts with:",
      user.password.substring(0, 30),
    );

    // Try direct comparison for debugging
    const directCompare = await bcrypt.compare(password, user.password);
    console.log("🔑 Direct bcrypt.compare result:", directCompare);

    if (!isPasswordValid) {
      console.log("❌ Password mismatch for:", email);
      console.log(
        "💡 This could mean the password was changed but not hashed properly",
      );
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("✅ Login successful for:", email, "| Role:", user.role);

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || "your-secret-key-change-in-production",
      { expiresIn: "7d" },
    );

    // Return user data WITHOUT sensitive info
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    };

    res.json({
      message: "Login successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error logging in: " + error.message });
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password")
      .populate("purchaseHistory");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Error fetching user data" });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = ["name", "phoneNumber", "address"];
    const updateData = {};

    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Error updating profile" });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Error changing password" });
  }
};

// Logout (client-side only, but we can blacklist token if needed)
const logout = async (req, res) => {
  // In a stateless JWT setup, logout is handled client-side
  // For additional security, you could implement a token blacklist
  res.json({ message: "Logged out successfully" });
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Normalize email
    const normalizedEmail = email.trim().toLowerCase();

    console.log(
      "🔑 Reset password request for:",
      email,
      "-> normalized:",
      normalizedEmail,
    );

    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({
        error: "Email, new password, and confirmation are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Find user by email (normalized)
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.log("❌ User not found with email:", normalizedEmail);
      const allUsers = await User.find({}, "email name role").lean();
      console.log("📋 All users in database:");
      allUsers.forEach((u) => {
        console.log("   -", u.email, "|", u.name, "|", u.role);
      });
      return res.status(404).json({
        error: "User not found with this email address",
        hint: "Please check if you are using the correct email",
      });
    }

    console.log(
      "✅ User found:",
      user.email,
      "| Name:",
      user.name,
      "| Role:",
      user.role,
    );

    // Manually hash the password before saving
    const bcrypt = require("bcrypt");
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Mark password as modified to ensure pre-save hook runs
    user.markModified("password");

    await user.save();

    console.log("✅ Password reset successful for:", user.email);

    res.json({
      message: "Password reset successful",
      success: true,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  resetPassword,
};
