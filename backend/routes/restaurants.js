const express = require('express');
const router = express.Router();
const {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantDishes,
  searchRestaurantsDishesAndProducts // Correct import
} = require('../controllers/restaurantController');

// Route to search restaurants and dishes
// Place non-ID based routes first to avoid conflicts with :id
router.get('/search', searchRestaurantsDishesAndProducts); // Correct route

// Test route to ensure routes are working
router.get('/test', (req, res) => {
  res.send('Restaurant routes are working!');
});

// Route to get all restaurants
router.get('/', getAllRestaurants);

// Route to get a specific restaurant by ID (with its associated dishes)
router.get('/:id', getRestaurantById);

// Route to get only dishes for a specific restaurant
router.get('/:id/dishes', getRestaurantDishes);

module.exports = router;
