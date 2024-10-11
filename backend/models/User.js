const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;  // Password is required only if googleId is not present
    },
    minlength: 8,  // Enforce minimum password length
    validate: {
      validator: function (v) {
        return /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*\W)/.test(v);  // Enforce strong password rules (digit, uppercase, lowercase, special character)
      },
      message: props => `${props.value} is not a valid password!`
    }
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true  // Allows googleId to be null for local auth users
  },
  name: {
    type: String,
    required: true
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to hash the password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    try {
      this.password = await bcrypt.hash(this.password, 12);  // Use 12 salt rounds for better security
    } catch (error) {
      next(error);
    }
  }
  next();
});

// A method to compare passwords for local authentication
userSchema.methods.comparePassword = async function (password) {
  if (!this.password) {
    throw new Error('This user does not have a password set.');  // Handle OAuth users
  }
  return bcrypt.compare(password, this.password);
};

// A method to check if the account is locked
userSchema.methods.isAccountLocked = function () {
  if (this.accountLockedUntil && this.accountLockedUntil > Date.now()) {
    return true;  // Account is still locked
  }
  return false;  // Account is not locked
};

module.exports = mongoose.model('User', userSchema);
