// backend/controllers/profileController.js

const User = require('../models/User');
const bcrypt = require('bcrypt');

// Standard response format
const standardResponse = (res, status, success, message, data = null) => {
  res.status(status).json({
    success,
    message,
    data,
  });
};

// Format user data for response
const formatUserData = (user) => {
  return {
    id: user._id,
    email: user.email,
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phoneNumber: user.phoneNumber || '',
    bio: user.bio || '',
    address: user.address || '',
    authProvider: user.authProvider,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Get the logged-in user's profile
exports.getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.userId);
    const user = await User.findById(req.userId).select('-password');
    console.log('Found user:', user);

    if (!user) {
      return standardResponse(res, 404, false, 'User not found');
    }

    standardResponse(res, 200, true, 'Profile retrieved successfully', formatUserData(user));
  } catch (error) {
    console.error('Error fetching user profile:', error);
    standardResponse(res, 500, false, 'Failed to fetch profile');
  }
};

// Update the logged-in user's profile
exports.updateProfile = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      bio,
      address,
      confirmPassword,
    } = req.body;

    console.log('Updating profile for user:', req.userId);
    console.log('Received data:', req.body);

    const user = await User.findById(req.userId);
    if (!user) {
      return standardResponse(res, 404, false, 'User not found');
    }

    // Check if user is trying to update password while using OAuth
    if (user.authProvider && password) {
      return standardResponse(res, 400, false, 'OAuth users cannot update their password');
    }

    // Handle email update
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        return standardResponse(res, 400, false, 'Email already in use');
      }
      user.email = email.toLowerCase();
    }

    // Handle password update
    if (password) {
      // Validate password requirements
      if (password.length < 8) {
        return standardResponse(res, 400, false, 'Password must be at least 8 characters long');
      }
      if (password !== confirmPassword) {
        return standardResponse(res, 400, false, 'Passwords do not match');
      }

      // Hash new password
      user.password = await bcrypt.hash(password, 12);
    }

    // Update other fields
    const updateFields = {
      firstName,
      lastName,
      phoneNumber,
      bio,
      address,
    };

    // Only update fields that are provided and not empty
    Object.entries(updateFields).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        user[field] = value.trim();
      }
    });

    // Save changes
    await user.save();
    console.log('Profile updated successfully for user:', req.userId);

    // Return updated user data
    standardResponse(res, 200, true, 'Profile updated successfully', formatUserData(user));
  } catch (error) {
    console.error('Error updating profile:', error);

    // Handle specific validation errors
    if (error.name === 'ValidationError') {
      return standardResponse(res, 400, false, 'Validation failed', {
        errors: Object.values(error.errors).map((err) => err.message),
      });
    }

    standardResponse(res, 500, false, 'Failed to update profile');
  }
};

// Utility to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Utility to validate phone number format
const isValidPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return true; // Optional field
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

// Add field validation middleware if needed
exports.validateProfileUpdate = (req, res, next) => {
  const { email, phoneNumber } = req.body;

  const errors = [];

  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (phoneNumber && !isValidPhoneNumber(phoneNumber)) {
    errors.push('Invalid phone number format');
  }

  if (errors.length > 0) {
    return standardResponse(res, 400, false, 'Validation failed', { errors });
  }

  next();
};
