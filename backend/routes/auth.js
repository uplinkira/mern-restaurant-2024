// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authController = require('../controllers/authController');
const { authMiddleware, handleValidationErrors } = require('../middleware/authMiddleware');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
router.post('/google', async (req, res) => {
  try {
    console.log('Received Google login request:', req.body);
    const { credential } = req.body;
    
    // 验证 Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    console.log('Google auth payload:', payload);

    // 查找或创建用户
    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = new User({
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
        googleId: payload.sub,
        isEmailVerified: true
      });
      await user.save();
      console.log('Created new user:', user);
    } else {
      console.log('Found existing user:', user);
    }

    // 生成 JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: { 
        user: user.toJSON(),
        token 
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Google authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

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
