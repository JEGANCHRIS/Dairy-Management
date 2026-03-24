const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const crypto = require('crypto');
require('dotenv').config();

const verifyHash = async () => {
  try {
    await connectDB();

    const email = 'Casper@gmail.com';
    const generatedHash = crypto.createHash('sha512').update(email.toLowerCase()).digest('hex');
    
    console.log('=== HASH VERIFICATION ===');
    console.log('Original email:', email);
    console.log('Generated hash:', generatedHash);
    console.log('Generated hash length:', generatedHash.length);
    
    // Find all users
    const users = await User.find({});
    console.log(`\nTotal users in DB: ${users.length}`);
    
    let casperFound = false;
    
    for (const user of users) {
      console.log(`\n--- User: ${user.name} ---`);
      console.log('Role:', user.role);
      console.log('DB email hash:', user.email);
      console.log('DB email length:', user.email.length);
      console.log('Generated hash length:', generatedHash.length);
      
      // Compare character by character
      let match = true;
      let firstDiff = -1;
      
      for (let i = 0; i < Math.min(user.email.length, generatedHash.length); i++) {
        if (user.email[i] !== generatedHash[i]) {
          match = false;
          firstDiff = i;
          break;
        }
      }
      
      if (user.email.length !== generatedHash.length) {
        match = false;
        console.log('❌ Length mismatch!');
      }
      
      if (match && user.email === generatedHash) {
        console.log('✅ EXACT MATCH FOUND!');
        casperFound = true;
        
        // Test password
        console.log('\nTesting password...');
        const testPassword = 'Casper@2000';
        const isPasswordValid = await user.comparePassword(testPassword);
        console.log('Password valid:', isPasswordValid);
        
      } else {
        console.log('❌ Hash mismatch');
        if (firstDiff !== -1) {
          console.log(`First difference at position ${firstDiff}`);
          console.log(`DB char: '${user.email[firstDiff]}' (code: ${user.email.charCodeAt(firstDiff)})`);
          console.log(`Generated char: '${generatedHash[firstDiff]}' (code: ${generatedHash.charCodeAt(firstDiff)})`);
        }
      }
    }
    
    if (!casperFound) {
      console.log('\n❌ Casper user not found with exact hash match');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

verifyHash();