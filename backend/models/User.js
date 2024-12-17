// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Basic Info
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: function () {
      return !this.authProviderId; // Password required only if not an OAuth user
    },
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false // Do not include password by default in queries
  },

  // Profile Info
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
    default: ''
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'],
    default: null
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [250, 'Bio cannot exceed 250 characters'],
    default: ''
  },
  address: {
    type: String,
    trim: true,
    maxlength: [250, 'Address cannot exceed 250 characters'],
    default: ''
  },

  // Authentication
  authProviderId: {
    type: String,
    default: null,
    index: true // Index for faster lookups by OAuth provider ID
  },
  authProvider: {
    type: String,
    enum: [null, 'google'], // Add other providers as needed
    default: null
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },

  // Security
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },

  googleId: {
    type: String,
    sparse: true
  },

  isEmailVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1, authProviderId: 1 });
userSchema.index({ username: 1 });

// Virtual Fields
userSchema.virtual('fullName').get(function () {
  if (!this.firstName && !this.lastName) return null;
  return `${this.firstName} ${this.lastName}`.trim();
});

// Password Hashing Middleware
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password') || this.authProviderId) {
      return next();
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance Methods
userSchema.methods = {
  // Compare password
  comparePassword: async function (candidatePassword) {
    if (!this.password) return false;
    try {
      return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
      return false;
    }
  },

  // Format user data for authentication responses
  toAuthJSON: function () {
    return {
      id: this._id,
      email: this.email,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      authProvider: this.authProvider
    };
  },

  // Format user data for profile responses
  toProfileJSON: function () {
    return {
      ...this.toAuthJSON(),
      phoneNumber: this.phoneNumber,
      bio: this.bio,
      address: this.address,
      createdAt: this.createdAt,
      lastLogin: this.lastLogin
    };
  },

  // Handle failed login attempts
  handleFailedLogin: async function () {
    this.loginAttempts += 1;
    if (this.loginAttempts >= 5) {
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    await this.save();
  },

  // Reset login attempts
  resetLoginAttempts: async function () {
    this.loginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  },

  toJSON: function() {
    const obj = this.toObject();
    delete obj.password;
    delete obj.__v;
    return obj;
  }
};

// Static Methods
userSchema.statics = {
  // Find by email with password
  findByEmailWithPassword: function (email) {
    return this.findOne({ email }).select('+password');
  },

  // Find by OAuth ID
  findByAuthId: function (provider, providerId) {
    return this.findOne({
      authProvider: provider,
      authProviderId: providerId
    });
  }
};

module.exports = mongoose.model('User', userSchema);
