// backend/routes/profile.js
const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get user profile
router.get('/me', authMiddleware, profileController.getProfile);

// Update user profile
router.put('/me', authMiddleware, profileController.updateProfile);

module.exports = router;
