require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/DairyManagement')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['superAdmin', 'admin', 'manager', 'user'], default: 'user' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Fix James's password
async function fixJamesPassword() {
  try {
    const email = 'james@gmail.com';
    const newPassword = 'James@2000';
    
    console.log('🔍 Looking for user:', email);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found!');
      mongoose.connection.close();
      process.exit(1);
    }
    
    console.log('✅ User found:', user.name, user.email, user.role);
    
    // Hash the new password properly
    console.log('🔐 Hashing new password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('📝 Old hash:', user.password.substring(0, 30));
    console.log('📝 New hash:', hashedPassword.substring(0, 30));
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    console.log('✅ Password updated successfully!');
    
    // Verify the password works
    console.log('🔐 Verifying password...');
    const isValid = await bcrypt.compare(newPassword, user.password);
    console.log('🔐 Password verification:', isValid ? '✅ VALID - Login should work now!' : '❌ INVALID');
    
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

fixJamesPassword();
