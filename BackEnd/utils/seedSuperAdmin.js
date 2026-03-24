const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');
const dotenv = require('dotenv');

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await connectDB();

    const email = 'Casper@gmail.com';
    const password = 'Casper@2000';
    const name = 'Casper';

    console.log('\n🔍 Checking for superAdmin...');

    // Check if user exists with plain email
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log('\n✅ SUPERADMIN ALREADY EXISTS');
      console.log('┌─────────────────────────────┐');
      console.log(`│ Email: ${existingUser.email.padEnd(26)}│`);
      console.log(`│ Name: ${existingUser.name.padEnd(27)}│`);
      console.log(`│ Role: ${existingUser.role.padEnd(27)}│`);
      console.log(`│ Status: ${existingUser.isActive ? 'Active'.padEnd(25) : 'Inactive'.padEnd(25)}│`);
      console.log('└─────────────────────────────┘');

      // Verify password
      const isValid = await existingUser.comparePassword(password);
      if (isValid) {
        console.log('\n🔑 Password verification: ✓ CORRECT');
      } else {
        console.log('\n⚠️ Password verification: ✗ INCORRECT (might need update)');
      }
    } else {
      console.log('\n📝 Creating new superAdmin...');

      const superAdmin = new User({
        name: name,
        email: email.toLowerCase(),  // Store plain email (lowercase)
        password: password,
        role: 'superAdmin',
        isActive: true
      });

      await superAdmin.save();

      console.log('\n✅ SUPERADMIN CREATED SUCCESSFULLY');
      console.log('┌─────────────────────────────┐');
      console.log(`│ Email: ${email.padEnd(26)}│`);
      console.log(`│ Password: ${password.padEnd(23)}│`);
      console.log(`│ Name: ${name.padEnd(27)}│`);
      console.log(`│ Role: superAdmin`.padEnd(32) + '│');
      console.log('└─────────────────────────────┘');
    }

    await mongoose.connection.close();
    console.log('\n📦 Database connection closed\n');
    process.exit(0);

  } catch (error) {
    if (error.code === 11000) {
      console.log('\n⚠️ SuperAdmin already exists (duplicate key)');
      console.log('📧 Email: Casper@gmail.com');
      console.log('✅ No action needed\n');
    } else {
      console.error('\n❌ Error seeding superAdmin:', error.message);
    }
    process.exit(1);
  }
};

seedSuperAdmin();