// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authController = require('../controllers/authController');
const { authMiddleware, handleValidationErrors } = require('../middleware/authMiddleware');

/**
 * Public Routes
 */

// Register new user
router.post(
  '/register',
  authController.validateRegister, // Validation middleware for registration
  handleValidationErrors, // Handles validation errors
  authController.register // Controller function for registration
);

// Login existing user
router.post(
  '/login',
  authController.validateLogin, // Validation middleware for login
  handleValidationErrors, // Handles validation errors
  authController.login // Controller function for login
);

// Google OAuth login
router.post('/google', authController.googleLogin); // Controller for Google OAuth login

/**
 * Protected Routes
 */

// Verify token validity
router.get(
  '/verify',
  authMiddleware, // Middleware to validate JWT
  (req, res) => {
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        userId: req.userId
      }
    });
  }
);

// Check email availability
router.get('/check-email/:email', async (req, res) => {
  try {
    const exists = await User.findOne({ email: req.params.email });
    res.json({
      success: true,
      data: {
        exists: !!exists
      }
    });
  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check email availability',
      data: null
    });
  }
});

// Logout (optional: can be used to blacklist tokens in the future)
router.post('/logout', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    data: null
  });
});

/**
 * Error Handlers
 */

// Validation errors
router.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      data: {
        errors: err.errors
      }
    });
  }
  next(err);
});

// JWT errors
router.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      data: null
    });
  }
  next(err);
});

// Generic error handler
router.use((err, req, res, next) => {
  console.error('Auth route error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    data: null
  });
});

module.exports = router;
