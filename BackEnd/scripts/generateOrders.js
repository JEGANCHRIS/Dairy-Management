const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Order = require('../models/Order');
const Product = require('../models/Product');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dairy-management';

async function generateOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find().select('_id price');
    
    if (products.length === 0) {
      console.error('No products found. Please add products first.');
      await mongoose.connection.close();
      return;
    }

    console.log(`Found ${products.length} products`);

    const orders = [];
    const now = new Date();
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 150; i++) {
      const product = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const totalPrice = product.price * quantity;
      
      const randomDate = new Date(
        sixtyDaysAgo.getTime() + Math.random() * (now.getTime() - sixtyDaysAgo.getTime())
      );

      orders.push({
        user: faker.database.mongodbObjectId(),
        productId: product._id,
        quantity: quantity,
        totalPrice: totalPrice,
        products: [{
          product: product._id,
          quantity: quantity,
          price: product.price
        }],
        totalAmount: totalPrice,
        paymentMethod: faker.helpers.arrayElement(['COD', 'UPI', 'Card', 'Net Banking']),
        paymentStatus: faker.helpers.arrayElement(['pending', 'completed', 'failed']),
        orderStatus: faker.helpers.arrayElement(['processing', 'shipped', 'delivered', 'cancelled']),
        shippingAddress: {
          street: faker.location.streetAddress(),
          city: faker.location.city(),
          state: faker.location.state(),
          zipCode: faker.location.zipCode(),
          country: 'India'
        },
        createdAt: randomDate
      });
    }

    await Order.insertMany(orders);
    console.log('Fake orders created successfully');

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error generating orders:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

generateOrders();
