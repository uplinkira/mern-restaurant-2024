const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Define the User schema
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String, // Only for local users (OAuth users will have authProviderId)
      default: null,
      required: function () {
        return !this.authProviderId; // Password is required if no OAuth provider ID is present
      },
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid international phone number'], // Allow international phone numbers
      default: null,
    },
    authProviderId: { // Generic field for OAuth providers like Google, Facebook, etc.
      type: String,
      default: null,
    },
    authProvider: { // Indicates the name of the OAuth provider
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt timestamps
  }
);

// Middleware: Hash password before saving, only for local users
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified and the user is not using OAuth
  if (!this.authProviderId && this.isModified('password')) {
    try {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds); // Hash password with bcrypt
    } catch (error) {
      return next(error); // Handle any hashing errors
    }
  }
  next();
});

// Instance Method: Compare input password with the stored hash, only for local users
userSchema.methods.comparePassword = async function (inputPassword) {
  // Return false instead of throwing an error for OAuth users
  if (!this.password) {
    return false; // OAuth users don't have a password
  }
  return bcrypt.compare(inputPassword, this.password);
};

// Method: Safely return user data without password hash (for public profile or responses)
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password; // Exclude password hash from the returned object
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
