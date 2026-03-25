require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Manual CORS headers - allow everything
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Logging middleware - log ALL requests
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// Serve static frontend files in production
if (process.env.NODE_ENV === "production") {
  // Serve from BackEnd/public (where dist is copied during build)
  const publicPath = path.join(__dirname, "public");

  try {
    const fs = require("fs");
    if (fs.existsSync(publicPath)) {
      console.log(`📁 Serving frontend from: ${publicPath}`);
      const files = fs.readdirSync(publicPath);
      console.log(`📄 Files: ${files.join(", ")}`);
      app.use(express.static(publicPath));
    } else {
      console.log(`⚠️  Public folder not found at: ${publicPath}`);
    }
  } catch (err) {
    console.error(`❌ Error with static files:`, err.message);
  }
}

// ==========================================
// PUBLIC ROUTES
// ==========================================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is running",
    time: new Date().toISOString(),
  });
});

// MongoDB connection status
app.get("/api/db/status", async (req, res) => {
  try {
    const mongoose = require("mongoose");
    const status = mongoose.connection.readyState;
    const statusMap = {
      0: "Disconnected",
      1: "Connected",
      2: "Connecting",
      3: "Disconnecting",
    };
    res.json({
      status: statusMap[status] || "Unknown",
      readyState: status,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test contact endpoint
app.post("/api/contact/test", (req, res) => {
  console.log("🧪 Contact test hit!");
  res.json({ message: "Contact route is working!", received: req.body });
});

// ==========================================
// IMPORT AND MOUNT ROUTES
// ==========================================
const connectDB = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const adminAIRoutes = require("./routes/adminAI");
const blogRoutes = require("./routes/blogRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const contactRoutes = require("./routes/contactRoutes");
const geminiRoutes = require("./routes/geminiRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const bankAccountRoutes = require("./routes/bankAccountRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin-ai", adminAIRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/gemini", geminiRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/bank-accounts", bankAccountRoutes);

console.log("✅ Wishlist routes loaded at /api/wishlist");

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req, res, next) => {
  console.log("❌ 404:", req.method, req.path);
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.path,
  });
});

// Global error handler (must have 4 parameters)
app.use((err, req, res, next) => {
  console.error("💥 Global error:", err);
  console.error("Stack:", err.stack);
  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

// SPA catch-all route - serve index.html for non-API routes (MUST be last)
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/uploads") ||
      req.path.startsWith("/assets")
    ) {
      return next();
    }

    // Serve index.html from public folder
    const indexPath = path.join(__dirname, "public", "index.html");

    try {
      const fs = require("fs");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        console.log(`⚠️  index.html not found at: ${indexPath}`);
        next();
      }
    } catch (err) {
      console.error(`❌ Error serving index.html:`, err.message);
      next();
    }
  });
}

// ==========================================
// START SERVER
// ==========================================

// Connect to DB asynchronously (non-blocking)
connectDB();

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(
    `📌 MongoDB: ${process.env.MONGODB_URI || "mongodb://localhost:27017/DairyManagement"}`,
  );
  console.log("\n📌 Test endpoints:");
  console.log("   GET  http://localhost:5000/health");
  console.log("   GET  http://localhost:5000/api/db/status");
  console.log("   POST http://localhost:5000/api/contact/test");
  console.log("   POST http://localhost:5000/api/contact (Submit form)\n");

  // Pre-warm Ollama model asynchronously (non-blocking)
  if (process.env.OLLAMA_URL) {
    const ollamaUrl = process.env.OLLAMA_URL;
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.2";
    console.log(`🤖 Pre-warming Ollama model: ${ollamaModel} (async)...`);
    setTimeout(() => {
      fetch(`${ollamaUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [{ role: "user", content: "hi" }],
          stream: false,
          options: { num_predict: 1 },
        }),
      })
        .then(() => console.log(`✅ Ollama model ready\n`))
        .catch(() =>
          console.log(
            `⚠️  Ollama pre-warm failed — make sure Ollama is running\n`,
          ),
        );
    }, 1000);
  }
});
