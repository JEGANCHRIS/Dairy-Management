const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const crypto = require('crypto');
require('dotenv').config();

const fixUserEmail = async () => {
  try {
    await connectDB();

    const email = 'Casper@gmail.com';
    const correctHash = crypto.createHash('sha512').update(email.toLowerCase()).digest('hex');
    
    console.log('Correct hash:', correctHash);
    
    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);
    
    for (const user of users) {
      console.log(`\nUser: ${user.name}`);
      console.log(`Current email hash: ${user.email}`);
      console.log(`Current email length: ${user.email.length}`);
      console.log(`Correct hash length: ${correctHash.length}`);
      
      // Update if name is Casper but email doesn't match
      if (user.name === 'Casper' && user.email !== correctHash) {
        console.log('Updating email for Casper...');
        user.email = email; // Set original email, let the model hash it
        await user.save();
        console.log('✅ User updated');
      }
    }
    
    // Verify the fix
    const fixedUser = await User.findOne({ 
      email: crypto.createHash('sha512').update(email.toLowerCase()).digest('hex') 
    });
    
    if (fixedUser) {
      console.log('\n✅ Fix successful! User can now login:');
      console.log('Name:', fixedUser.name);
      console.log('Role:', fixedUser.role);
    } else {
      console.log('\n❌ Fix failed - user still not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixUserEmail();