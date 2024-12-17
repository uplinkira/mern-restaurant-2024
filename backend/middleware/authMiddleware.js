// backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Standard response format
const standardResponse = (res, status, success, message, data = null) => {
  res.status(status).json({
    success,
    message,
    data,
  });
};

// JWT Configuration
const JWT_CONFIG = {
  expiresIn: '24h',
  algorithm: 'HS256',
};

// Middleware for token validation
const authMiddleware = (req, res, next) => {
  console.log('⭐ Starting auth middleware check');
  const authHeader = req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    console.error('Authorization header missing or malformed:', {
      header: authHeader,
      path: req.path,
      method: req.method,
    });
    return standardResponse(res, 401, false, 'Authorization header missing or malformed');
  }

  const token = authHeader.split(' ')[1];
  console.log('🔑 Token extracted from header');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, JWT_CONFIG);
    console.log('🔓 Token verified successfully:', {
      decoded,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString(),
    });

    // Adjusted to check multiple possible keys for user ID
    const userId = decoded.userId || decoded.id || decoded._id;
    if (!userId) {
      console.error('Invalid token: missing userId in payload:', decoded);
      return standardResponse(res, 401, false, 'Invalid token: missing user information');
    }

    req.userId = userId;
    console.log('✅ User authenticated:', {
      userId: req.userId,
      path: req.path,
      method: req.method,
    });
    next();
  } catch (error) {
    console.error('JWT Verification Error:', {
      type: error.name,
      message: error.message,
      expiration: error.expiredAt,
    });

    switch (error.name) {
      case 'TokenExpiredError':
        return standardResponse(res, 403, false, 'Token expired. Please log in again.');
      case 'JsonWebTokenError':
        return standardResponse(res, 403, false, 'Invalid token provided.');
      default:
        return standardResponse(res, 500, false, 'Authentication failed.');
    }
  }
};

// Validation rules
const commonValidationRules = {
  email: check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),

  password: check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),

  username: check('username')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Username is required'),

  authHeader: check('Authorization')
    .exists()
    .withMessage('Authorization header is required')
    .matches(/^Bearer .+/)
    .withMessage('Authorization header must be in the format: Bearer [token]'),
};

// Validation middleware sets
const validateAuth = {
  register: [
    commonValidationRules.email,
    commonValidationRules.password,
    commonValidationRules.username,
  ],

  login: [
    commonValidationRules.email,
    check('password').not().isEmpty().withMessage('Password is required'),
  ],

  token: [commonValidationRules.authHeader],
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return standardResponse(res, 400, false, 'Validation failed', {
      errors: errors.array(),
    });
  }
  next();
};

// Role-based authorization middleware
const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role) {
    console.error(
      `Access denied: User role "${req.user?.role}" does not match required role "${role}"`
    );
    return standardResponse(res, 403, false, 'Insufficient permissions');
  }
  next();
};

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified:', decoded);
    
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', {
      error: error.message,
      token: req.headers.authorization ? '[REDACTED]' : 'none'
    });
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = {
  authMiddleware,
  validateAuth,
  handleValidationErrors,
  requireRole,
  standardResponse,
  verifyToken,
};
