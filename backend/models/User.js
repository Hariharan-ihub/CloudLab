const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() {
      return this.authProvider === 'local'; // Username required only for local auth
    },
    unique: true,
    sparse: true, // Allows multiple null values
    trim: true,
    minLength: [3, 'Username must be at least 3 characters'],
    maxLength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: function() {
      // Password not required for OAuth users
      return !this.googleId && this.authProvider !== 'google';
    },
    minLength: [6, 'Password must be at least 6 characters']
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  hasCompletedOnboarding: {
    type: Boolean,
    default: false
  },
  onboardingPhase: {
    type: String,
    enum: ['role', 'project', 'jenkins', 'completed'],
    default: 'role'
  },
  selectedRole: {
    type: Object,
    default: null
  },
  onboardingRepo: {
    type: Object,
    default: null
  }
});

// Hash password before saving (only for local auth)
UserSchema.pre('save', async function() {
  // Skip password hashing if no password (OAuth users) or password not modified
  if (!this.isModified('password') || !this.password) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get user without password
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

module.exports = mongoose.model('User', UserSchema);

