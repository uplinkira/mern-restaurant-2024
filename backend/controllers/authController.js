const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function: Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Validation rules for registration
exports.validateRegister = [
  check('email').isEmail().withMessage('Please enter a valid email'),
  check('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W)/).withMessage(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  check('username').not().isEmpty().withMessage('Username is required'),
];

// Register user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password, username, firstName = '', lastName = '', phoneNumber = null } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Check if the user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Create a new user
    const user = new User({
      email: normalizedEmail,
      username,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Registration successful!',
      user: { id: user._id, email: user.email, username: user.username },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
};

// Validation rules for login
exports.validateLogin = [
  check('email').isEmail().withMessage('Please enter a valid email'),
  check('password').not().isEmpty().withMessage('Password is required'),
];

// Login user
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful!',
      user: { id: user._id, email: user.email, username: user.username },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed. Please try again later.' });
  }
};

// Google OAuth login using GIS
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Credential token is missing' });
    }

    // Verify the Google credential token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;
    const normalizedEmail = email.toLowerCase();

    // Find or create user
    let user = await User.findOne({ authProviderId: googleId });
    if (!user) {
      user = new User({
        authProviderId: googleId,
        authProvider: 'google',
        email: normalizedEmail,
        username: name,
      });
      await user.save();
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Google login successful!',
      user: { id: user._id, email: user.email, username: user.username },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Google login failed. Please try again later.' });
  }
};

module.exports = {
  validateRegister: exports.validateRegister,
  register: exports.register,
  validateLogin: exports.validateLogin,
  login: exports.login,
  googleLogin: exports.googleLogin,
};
