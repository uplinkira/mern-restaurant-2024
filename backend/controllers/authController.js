const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper function for generating JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1h' });
};

// Register user
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Ensure all required fields are provided
    if (!email || !password || !name) {
      return res.status(400).json({ message: 'All fields are required (email, password, name)' });
    }

    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // Log the registration process for debugging
    console.log(`Registering user with email: ${email}, name: ${name}`);

    // Create and save the user (password hashing will happen in the User model pre-save hook)
    const user = new User({ email, password, name });
    await user.save();

    // Log user creation success
    console.log('User saved successfully:', user);

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    res.status(201).json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ensure all required fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Log the login attempt
    console.log(`Logging in user with email: ${email}`);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Log the found user for debugging
    console.log('Found user:', user);

    // Use the comparePassword method from the User model to check the password
    const isMatch = await user.comparePassword(password);

    // Log the result of the password comparison
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and token
    res.json({ user: { id: user._id, email: user.email, name: user.name }, token });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Login failed. Please try again later.' });
  }
};

// Google OAuth login using Google Identity Services (GIS)
exports.googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Credential token is missing' });
    }

    // Verify the Google credential token using Google Identity Services
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    // Check if the user already exists in the database
    let user = await User.findOne({ googleId });

    if (!user) {
      // If user doesn't exist, create a new one
      user = new User({ googleId, email, name });
      await user.save();
    }

    // Generate JWT token for authenticated user
    const token = generateToken(user._id);

    // Send the token and user details back to the frontend
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Google login failed. Please try again later.' });
  }
};

module.exports = app;
