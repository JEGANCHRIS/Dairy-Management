const mongoose = require("mongoose");
const Product = require("../models/Product");
const User = require("../models/User");
const connectDB = require("../config/database");

const seedDatabase = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    // Check if products already exist
    const productCount = await Product.countDocuments();
    
    if (productCount > 0) {
      console.log(`✅ Database already has ${productCount} products - skipping seed`);
    } else {
      console.log("📦 Seeding products...");
      
      const sampleProducts = [
        {
          name: "Fresh Cow Milk",
          category: "milk",
          variety: "Full Cream",
          description: "Fresh full cream milk from grass-fed cows. Rich in calcium and protein.",
          price: 60,
          stock: 50,
          images: ["/assets/freshmilk.webp"],
          nutritionalInfo: { calories: 150, protein: 8, fat: 8, calcium: 300 },
        },
        {
          name: "Organic Butter",
          category: "butter",
          variety: "Salted",
          description: "Creamy organic butter made from fresh cream. Perfect for baking and cooking.",
          price: 80,
          stock: 30,
          images: ["/assets/organic-butter.webp"],
          nutritionalInfo: { calories: 720, protein: 1, fat: 81, calcium: 24 },
        },
        {
          name: "Cheddar Cheese",
          category: "cheese",
          variety: "Aged Cheddar",
          description: "Aged cheddar cheese with rich, sharp flavor. Great for sandwiches and pasta.",
          price: 120,
          stock: 25,
          images: ["/assets/cheddar-cheese.webp"],
          nutritionalInfo: { calories: 400, protein: 25, fat: 33, calcium: 720 },
        },
        {
          name: "Greek Yogurt",
          category: "yogurt",
          variety: "Plain",
          description: "Thick and creamy Greek yogurt, high in protein. Perfect for breakfast or snacks.",
          price: 90,
          stock: 40,
          images: ["/assets/Greek-Yogurt.webp"],
          nutritionalInfo: { calories: 100, protein: 10, fat: 0.5, calcium: 110 },
        },
        {
          name: "Fresh Paneer",
          category: "paneer",
          variety: "Soft",
          description: "Fresh homemade style paneer, perfect for curries and grilling.",
          price: 100,
          stock: 20,
          images: ["/assets/fresh-paneer.webp"],
          nutritionalInfo: { calories: 320, protein: 18, fat: 25, calcium: 480 },
        },
        {
          name: "Mango Lassi",
          category: "lassi",
          variety: "Sweet",
          description: "Refreshing mango flavored lassi, a perfect summer drink.",
          price: 50,
          stock: 35,
          images: ["/assets/mango-lassi.webp"],
          nutritionalInfo: { calories: 120, protein: 3, fat: 2, calcium: 80 },
        },
        {
          name: "Chocolate Milkshake",
          category: "milkshake",
          variety: "Chocolate",
          description: "Creamy chocolate milkshake made with real milk and chocolate.",
          price: 70,
          stock: 30,
          images: ["/assets/chocolate-milkshake.webp"],
          nutritionalInfo: { calories: 250, protein: 6, fat: 5, calcium: 150 },
        },
        {
          name: "Sour Cream",
          category: "cream",
          variety: "Sour",
          description: "Tangy sour cream, perfect for baked potatoes and dips.",
          price: 45,
          stock: 40,
          images: ["/assets/sour-cream.webp"],
          nutritionalInfo: { calories: 180, protein: 2, fat: 18, calcium: 50 },
        },
      ];

      const products = await Product.insertMany(sampleProducts);
      console.log(`✅ Seeded ${products.length} products`);
    }

    // Check if super admin exists
    const adminCount = await User.countDocuments({ role: 'superAdmin' });
    
    if (adminCount > 0) {
      console.log("✅ Super admin already exists - skipping");
    } else {
      console.log("👤 Creating super admin...");
      
      const superAdmin = new User({
        name: "Casper",
        email: "casper@gmail.com",
        password: "Casper@2000",
        role: "superAdmin",
        isActive: true,
      });

      await superAdmin.save();
      console.log("✅ Super admin created: casper@gmail.com / Casper@2000");
    }

    await mongoose.connection.close();
    console.log("📦 Database seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
};

seedDatabase();
