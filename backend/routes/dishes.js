const express = require('express');
const router = express.Router();
const {
  getAllDishes,
  getDishById,
  searchDishes,
} = require('../controllers/dishController'); // Import dish controller functions

// Search dishes (Place this before /:id to avoid conflicts)
router.get('/search', searchDishes);

// Get all dishes
router.get('/', getAllDishes);

// Get dish by ID
router.get('/:id', getDishById);

module.exports = router;
