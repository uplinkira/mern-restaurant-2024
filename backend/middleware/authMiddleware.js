const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Middleware for token validation
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization header missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token: missing user information' });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error(`JWT error: ${error.message}`, { type: error.name, expiration: error.expiredAt });

    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ message: 'Token expired. Please login again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: 'Invalid token provided.' });
    } else {
      return res.status(500).json({ message: 'Failed to authenticate token.' });
    }
  }
};

// Validation middleware for 'Authorization' header
const validateAuthHeader = [
  check('Authorization')
    .exists().withMessage('Authorization header is required')
    .matches(/^Bearer .+/).withMessage('Authorization header must be in the format: Bearer [token]'),
];

// Custom error handler for validation errors
const checkValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { authMiddleware, validateAuthHeader, checkValidationErrors };
