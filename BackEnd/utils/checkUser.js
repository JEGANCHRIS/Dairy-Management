const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const crypto = require('crypto');
require('dotenv').config();

const checkUser = async () => {
  try {
    await connectDB();

    // Hash the email the same way it's done in the model
    const email = 'Casper@gmail.com';
    const hashedEmail = crypto.createHash('sha512').update(email.toLowerCase()).digest('hex');
    
    console.log('Original email:', email);
    console.log('Hashed email:', hashedEmail);
    console.log('Hashed email length:', hashedEmail.length);

    // Find user by hashed email - try different methods
    console.log('\n--- Trying different query methods ---');
    
    // Method 1: Direct findOne
    const user1 = await User.findOne({ email: hashedEmail });
    console.log('Method 1 (direct findOne):', user1 ? '✅ Found' : '❌ Not found');
    
    // Method 2: Using where
    const user2 = await User.where('email').equals(hashedEmail).findOne();
    console.log('Method 2 (where):', user2 ? '✅ Found' : '❌ Not found');
    
    // Method 3: Find all and filter manually
    const allUsers = await User.find({});
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
    let found = false;
    allUsers.forEach(user => {
      console.log(`\nUser: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Email in DB: ${user.email}`);
      console.log(`Email length: ${user.email.length}`);
      console.log(`Match: ${user.email === hashedEmail ? 'YES' : 'NO'}`);
      
      if (user.email === hashedEmail) {
        found = true;
        console.log('✅ MATCH FOUND!');
        
        // Test password
        if (user.comparePassword) {
          user.comparePassword('Casper@2000').then(isValid => {
            console.log('Password valid:', isValid);
          }).catch(err => {
            console.log('Password check error:', err.message);
          });
        }
      }
    });
    
    if (!found) {
      console.log('\n❌ No matching user found after manual check');
      
      // Show first few characters of each email for comparison
      console.log('\nEmail comparisons:');
      console.log(`Searching for: ${hashedEmail.substring(0, 30)}...`);
      allUsers.forEach((user, index) => {
        console.log(`DB user ${index}: ${user.email.substring(0, 30)}...`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUser();