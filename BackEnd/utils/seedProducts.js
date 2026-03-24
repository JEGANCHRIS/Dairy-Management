const mongoose = require("mongoose");
const Product = require("../models/Product");
const connectDB = require("../config/database");
require("dotenv").config();

const sampleProducts = [
  {
    name: "Fresh Cow Milk",
    category: "milk",
    variety: "Full Cream",
    description:
      "Fresh full cream milk from grass-fed cows. Rich in calcium and protein.",
    price: 60,
    stock: 50,
    images: [
      "http://localhost:5000/assets/freshmilk.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 150,
      protein: 8,
      fat: 8,
      calcium: 300,
    },
  },
  {
    name: "Organic Butter",
    category: "butter",
    variety: "Salted",
    description:
      "Creamy organic butter made from fresh cream. Perfect for baking and cooking.",
    price: 80,
    stock: 30,
    images: [
      "http://localhost:5000/assets/organic-butter.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 720,
      protein: 1,
      fat: 81,
      calcium: 24,
    },
  },
  {
    name: "Cheddar Cheese",
    category: "cheese",
    variety: "Aged Cheddar",
    description:
      "Aged cheddar cheese with rich, sharp flavor. Great for sandwiches and pasta.",
    price: 120,
    stock: 25,
    images: [
      "http://localhost:5000/assets/cheddar-cheese.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 400,
      protein: 25,
      fat: 33,
      calcium: 720,
    },
  },
  {
    name: "Greek Yogurt",
    category: "yogurt",
    variety: "Plain",
    description:
      "Thick and creamy Greek yogurt, high in protein. Perfect for breakfast or snacks.",
    price: 90,
    stock: 40,
    images: [
      "http://localhost:5000/assets/Greek-Yogurt.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 100,
      protein: 10,
      fat: 0.5,
      calcium: 110,
    },
  },
  {
    name: "Fresh Paneer",
    category: "paneer",
    variety: "Soft",
    description:
      "Fresh homemade style paneer, perfect for curries and grilling.",
    price: 100,
    stock: 20,
    images: [
      "http://localhost:5000/assets/fresh-paneer.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 320,
      protein: 18,
      fat: 25,
      calcium: 480,
    },
  },
  {
    name: "Mango Lassi",
    category: "lassi",
    variety: "Sweet",
    description: "Refreshing mango flavored lassi, a perfect summer drink.",
    price: 50,
    stock: 35,
    images: [
      "http://localhost:5000/assets/mango-lassi.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 120,
      protein: 3,
      fat: 2,
      calcium: 80,
    },
  },
  {
    name: "Chocolate Milkshake",
    category: "milkshake",
    variety: "Chocolate",
    description:
      "Creamy chocolate milkshake made with real milk and chocolate.",
    price: 70,
    stock: 30,
    images: [
      "http://localhost:5000/assets/chocolate-milkshake.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 250,
      protein: 6,
      fat: 5,
      calcium: 150,
    },
  },
  {
    name: "Sour Cream",
    category: "cream",
    variety: "Sour",
    description: "Tangy sour cream, perfect for baked potatoes and dips.",
    price: 45,
    stock: 40,
    images: [
      "http://localhost:5000/assets/sour-cream.webp",
    ],
    videoUrl: "",
    nutritionalInfo: {
      calories: 180,
      protein: 2,
      fat: 18,
      calcium: 50,
    },
  },
];

const seedProducts = async () => {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDB();

    console.log("📊 Checking existing products...");
    const count = await Product.countDocuments();
    console.log(`📦 Found ${count} existing products`);

    if (count > 0) {
      console.log("⚠️ Products already exist in database.");
      console.log("\n🔄 Updating existing products with new images...\n");
      
      // Delete existing products
      await Product.deleteMany({});
      console.log("🗑️ Cleared existing products");
    }

    console.log("🌱 Seeding products...");

    // Insert sample products
    const products = await Product.insertMany(sampleProducts);

    console.log(`\n✅ SUCCESS: Added ${products.length} sample products!`);
    console.log("\n📋 Products added:");
    products.forEach((product, index) => {
      console.log(
        `   ${index + 1}. ${product.name} - ₹${product.price} (${product.category})`,
      );
    });

    console.log("\n📝 Images are loaded from the 'assets' folder:");
    console.log("   - freshmilk.webp, organic-butter.webp, cheddar-cheese.webp");
    console.log("   - Greek-Yogurt.webp, fresh-paneer.webp, mango-lassi.webp");
    console.log("   - chocolate-milkshake.webp, sour-cream.webp\n");

    await mongoose.connection.close();
    console.log("\n📦 Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);

    // Check for duplicate key errors
    if (error.code === 11000) {
      console.log("⚠️ Some products may already exist in the database");
    }

    process.exit(1);
  }
};

seedProducts();
