require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dairy-management')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['superAdmin', 'admin', 'manager', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Create or update test admin user
async function createTestUser() {
  try {
    const email = 'admin@test.com';
    const password = 'admin123';
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('📝 User exists, updating password...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
      console.log('✅ User updated successfully!');
    } else {
      console.log('📝 Creating new user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = new User({
        name: 'Test Admin',
        email,
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      await user.save();
      console.log('✅ User created successfully!');
    }
    
    // Verify the password works
    const foundUser = await User.findOne({ email });
    const isValid = await bcrypt.compare(password, foundUser.password);
    console.log('🔐 Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    console.log('📧 Email:', foundUser.email);
    console.log('🔑 Hash starts with:', foundUser.password.substring(0, 30));
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

createTestUser();
