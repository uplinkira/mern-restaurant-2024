// backend/controllers/authController.js
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Initialize OAuth client with timeout and retry options
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  timeout: 5000,  // 5 seconds timeout
  retry: true,
  retries: 3
});

// Constants
const JWT_CONFIG = {
  expiresIn: '24h',
  algorithm: 'HS256'
};

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, JWT_CONFIG);
};

const standardResponse = (res, status, success, message, data = null) => {
  res.status(status).json({
    success,
    message,
    data
  });
};

// Enhanced error handling
const handleError = (error, res, operation) => {
  console.error(`${operation} error:`, error);
  const status = error.status || 500;
  const message = error.message || `${operation} failed. Please try again.`;
  return standardResponse(res, status, false, message);
};

// Validation rules
const validateRegister = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  check('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores')
];

const validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password')
    .not()
    .isEmpty()
    .withMessage('Password is required')
];

// Controller functions
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return standardResponse(res, 400, false, 'Validation failed', { 
        errors: errors.array() 
      });
    }

    const { 
      email, 
      password, 
      username, 
      firstName = '', 
      lastName = '', 
      phoneNumber = null 
    } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username }] 
    });
    
    if (existingUser) {
      return standardResponse(
        res, 
        400, 
        false, 
        existingUser.email === email.toLowerCase() ? 'Email already registered' : 'Username already taken'
      );
    }

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      firstName,
      lastName,
      phoneNumber
    });

    await user.save();

    // Generate token and return user data
    const token = generateToken(user._id);
    const userData = user.toAuthJSON();

    standardResponse(res, 201, true, 'Registration successful', { 
      user: userData, 
      token 
    });

  } catch (error) {
    handleError(error, res, 'Registration');
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return standardResponse(res, 400, false, 'Validation failed', { 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find user with enhanced error handling
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return standardResponse(res, 401, false, 'Invalid email or password');
    }

    // Check account lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return standardResponse(
        res, 
        403, 
        false, 
        `Account is locked. Please try again after ${new Date(user.lockUntil).toLocaleString()}`
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.handleFailedLogin();
      return standardResponse(res, 401, false, 'Invalid email or password');
    }

    // Reset login attempts and update login time
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    // Generate token and return user data
    const token = generateToken(user._id);
    const userData = user.toAuthJSON();

    standardResponse(res, 200, true, 'Login successful', { 
      user: userData, 
      token 
    });

  } catch (error) {
    handleError(error, res, 'Login');
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return standardResponse(res, 400, false, 'Google credential is required');
    }

    // Verify Google token with enhanced error handling
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError);
      return standardResponse(res, 401, false, 'Failed to verify Google token');
    }

    const { 
      sub: googleId, 
      email, 
      name, 
      given_name, 
      family_name 
    } = ticket.getPayload();

    const normalizedEmail = email.toLowerCase();

    // Find or create user with enhanced error handling
    let user = await User.findOne({ 
      $or: [{ authProviderId: googleId }, { email: normalizedEmail }] 
    });

    if (!user) {
      // Create new Google user
      user = new User({
        email: normalizedEmail,
        username: `${name.replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`,
        firstName: given_name || '',
        lastName: family_name || '',
        authProviderId: googleId,
        authProvider: 'google'
      });
    } else if (!user.authProviderId) {
      // Link existing account with Google
      user.authProviderId = googleId;
      user.authProvider = 'google';
      if (!user.firstName) user.firstName = given_name;
      if (!user.lastName) user.lastName = family_name;
    }

    // Update user and save
    user.lastLogin = new Date();
    await user.save();

    // Generate token and return user data
    const token = generateToken(user._id);
    const userData = user.toAuthJSON();

    standardResponse(res, 200, true, 'Google login successful', { 
      user: userData, 
      token 
    });

  } catch (error) {
    handleError(error, res, 'Google login');
  }
};

module.exports = {
  validateRegister,
  validateLogin,
  register,
  login,
  googleLogin
};