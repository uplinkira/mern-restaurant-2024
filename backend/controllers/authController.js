// backend/controllers/authController.js

const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Initialize OAuth client with timeout and retry options
const client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  timeout: 5000, // 5 seconds timeout
  retry: true,
  retries: 3,
});

// Constants
const JWT_CONFIG = {
  expiresIn: '24h',
  algorithm: 'HS256',
};

// Helper functions
const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, JWT_CONFIG);
  console.log('Generated JWT token with payload:', { userId });
  return token;
};

const standardResponse = (res, status, success, message, data = null) => {
  res.status(status).json({
    success,
    message,
    data,
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
    .withMessage('Username can only contain letters, numbers and underscores'),
];

const validateLogin = [
  check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  check('password').not().isEmpty().withMessage('Password is required'),
];

// Controller functions
const register = async (req, res) => {
  try {
    // 1. 记录请求开始
    console.log('🚀 Registration attempt started:', {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      headers: {
        'content-type': req.headers['content-type'],
        origin: req.headers.origin
      }
    });

    // 2. 记录请求体（安全地）
    console.log('������ Request body:', {
      email: req.body.email,
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phoneNumber: req.body.phoneNumber,
      hasPassword: !!req.body.password
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, username, firstName, lastName, phoneNumber } = req.body;

    // 3. 检查数据库连接
    if (!User.db.readyState) {
      console.error('💔 Database connection not ready');
      throw new Error('Database connection not ready');
    }

    // 4. 检查现有用户
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (existingUser) {
      console.log('👥 User already exists:', {
        email: existingUser.email === email.toLowerCase(),
        username: existingUser.username === username
      });
      return res.status(400).json({
        success: false,
        message: existingUser.email === email.toLowerCase() 
          ? 'Email already registered' 
          : 'Username already taken'
      });
    }

    // 5. 创建用户前记录
    console.log('👤 Attempting to create user:', {
      email: email.toLowerCase(),
      username,
      hasFirstName: !!firstName,
      hasLastName: !!lastName,
      hasPhoneNumber: !!phoneNumber
    });

    const user = new User({
      email: email.toLowerCase(),
      username,
      password,
      firstName,
      lastName,
      phoneNumber
    });

    // 6. 保存用户
    try {
      await user.save();
      console.log('✅ User created successfully:', user._id);
    } catch (saveError) {
      console.error('💥 User save error:', {
        error: saveError.message,
        code: saveError.code,
        name: saveError.name
      });
      throw saveError;
    }

    // 7. 生成 token
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 8. 发送成功响应
    console.log('🎉 Registration completed successfully');
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: user.toAuthJSON(),
        token
      }
    });

  } catch (error) {
    // 9. 详细错误日志
    console.error('💥 Registration error:', {
      error: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

    // 10. 根据错误类型返回不同的响应
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'ValidationError',
        message: error.message
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'DuplicateError',
        message: 'Username or email already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.name || 'Error',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Registration failed'
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return standardResponse(res, 400, false, 'Validation failed', {
        errors: errors.array(),
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
      token,
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
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification error:', verifyError);
      return standardResponse(res, 401, false, 'Failed to verify Google token');
    }

    const { sub: googleId, email, name, given_name, family_name } = ticket.getPayload();

    const normalizedEmail = email.toLowerCase();

    // Find or create user with enhanced error handling
    let user = await User.findOne({
      $or: [{ authProviderId: googleId }, { email: normalizedEmail }],
    });

    if (!user) {
      // Create new Google user
      user = new User({
        email: normalizedEmail,
        username: `${name.replace(/\s+/g, '')}${Math.floor(Math.random() * 1000)}`,
        firstName: given_name || '',
        lastName: family_name || '',
        authProviderId: googleId,
        authProvider: 'google',
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
      token,
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
  googleLogin,
};
