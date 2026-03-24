const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const crypto = require('crypto');
const dotenv = require('dotenv');

dotenv.config();

const fixSuperAdminEmail = async () => {
  try {
    await connectDB();

    const plainEmail = 'Casper@gmail.com';
    const hashedEmail = crypto.createHash('sha512').update(plainEmail.toLowerCase()).digest('hex');

    console.log('\n🔍 Searching for superAdmin with hashed email...');

    // Find user with hashed email
    const userWithHashedEmail = await User.findOne({ email: hashedEmail });

    if (!userWithHashedEmail) {
      console.log('\nℹ️  No user found with hashed email');
      console.log('   The email might already be plain text or user does not exist.\n');
      
      // Check if user exists with plain email
      const userWithPlainEmail = await User.findOne({ email: plainEmail.toLowerCase() });
      if (userWithPlainEmail) {
        console.log('✅ Found superAdmin with plain email:');
        console.log(`   Email: ${userWithPlainEmail.email}`);
        console.log(`   Name: ${userWithPlainEmail.name}`);
        console.log(`   Role: ${userWithPlainEmail.role}\n`);
      }
    } else {
      console.log('\n📝 Found superAdmin with hashed email');
      console.log(`   Current hashed email: ${hashedEmail.substring(0, 50)}...`);
      console.log(`   Name: ${userWithHashedEmail.name}`);
      console.log(`   Role: ${userWithHashedEmail.role}`);

      // Update to plain email
      userWithHashedEmail.email = plainEmail.toLowerCase();
      await userWithHashedEmail.save();

      console.log('\n✅ SUCCESSFULLY UPDATED EMAIL');
      console.log('┌─────────────────────────────┐');
      console.log(`│ Email: ${userWithHashedEmail.email.padEnd(26)}│`);
      console.log(`│ Name: ${userWithHashedEmail.name.padEnd(27)}│`);
      console.log(`│ Role: ${userWithHashedEmail.role.padEnd(27)}│`);
      console.log('└─────────────────────────────┘');
      console.log('\n🔑 You can now login with:');
      console.log(`   Email: ${plainEmail}`);
      console.log(`   Password: Casper@2000\n`);
    }

    await mongoose.connection.close();
    console.log('📦 Database connection closed\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error fixing superAdmin email:', error.message);
    console.error(error);
    process.exit(1);
  }
};

fixSuperAdminEmail();
