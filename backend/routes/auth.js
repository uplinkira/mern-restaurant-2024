const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth client initialization
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

// Register user
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  try {
    console.log(`Registering user with email: ${email}, name: ${name}`);

    // Ensure email is lowercase
    const normalizedEmail = email.toLowerCase();

    // Check if the user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      console.log('User already exists with email:', normalizedEmail);
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password and log process
    const hashedPassword = await bcrypt.hash(password, 12);  // Adding 12 rounds of salting
    console.log('Hashed password generated:', hashedPassword);

    // Create the user and save it
    const user = new User({ email: normalizedEmail, password: hashedPassword, name });
    await user.save();
    console.log('User saved successfully:', user);

    // Generate JWT token
    const token = generateToken(user._id);
    res.status(201).json({ token, email: user.email });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// Local login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(`Logging in user with email: ${email}`);

    // Normalize email to avoid case sensitivity issues
    const normalizedEmail = email.toLowerCase();

    // Find the user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log('User not found with email:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Found user:', user);

    // Compare password and log process
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match result:', isMatch);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);
    res.json({ token, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
});

// Google OAuth login using Google Identity Services
router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;  // The token from the client-side Google Identity Services

  try {
    // Verify the Google credential token using GIS
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    console.log('Google login payload:', payload);

    // Normalize email for consistency
    const normalizedEmail = email.toLowerCase();

    let user = await User.findOne({ googleId });
    if (!user) {
      // Create a new user if not found
      user = new User({ googleId, email: normalizedEmail, name });
      await user.save();
      console.log('New user created with Google OAuth:', user);
    }

    const token = generateToken(user._id);
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
});

module.exports = router;
