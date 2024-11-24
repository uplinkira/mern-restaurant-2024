const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware, validateAuthHeader, checkValidationErrors } = require('../middleware/authMiddleware');

// User registration route with validation
router.post('/register', authController.validateRegister, checkValidationErrors, authController.register);

// User login route with validation
router.post('/login', authController.validateLogin, checkValidationErrors, authController.login);

// Google OAuth login route with proper error handling
router.post('/auth/google', (req, res, next) => {
  const { credential } = req.body;
  
  if (!credential) {
    return res.status(400).json({ message: 'Credential token is missing' });
  }

  next(); // Proceed to the controller
}, authController.googleLogin);

// Protected route example (if needed in the future)
// router.get('/profile', authMiddleware, authController.getProfile); // Example of using authMiddleware for secured routes

module.exports = router;
