
const express = require('express');
const router = express.Router();
const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantDishes,
  searchRestaurantsAndDishes
} = require('../controllers/restaurantController');

// Route to search restaurants and dishes
// Note: Placed before the dynamic :id route to avoid conflicts.
router.get('/search', searchRestaurantsAndDishes);

// Route to get all restaurants
router.get('/', getAllRestaurants);

// Route to get a specific restaurant by ID (with its associated dishes)
router.get('/:id', getRestaurantById);

// Route to get only dishes for a specific restaurant
router.get('/:id/dishes', getRestaurantDishes);

module.exports = router;

