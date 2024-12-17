// backend/routes/restaurants.js
const express = require('express');
const router = express.Router();
const {
  applyPagination,
  getAllRestaurants,
  getRestaurantBySlug,
  getDishesByRestaurant,
  getMenusByRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant
} = require('../controllers/restaurantController');

// Apply pagination middleware to relevant routes
router.get('/', applyPagination, getAllRestaurants);

// GET restaurant by slug
router.get('/:slug', getRestaurantBySlug);

// GET dishes for a specific restaurant
router.get('/:slug/dishes', getDishesByRestaurant);

// GET menus for a specific restaurant
router.get('/:slug/menus', getMenusByRestaurant);

// POST create a new restaurant
router.post('/', createRestaurant);

// PUT update a restaurant
router.put('/:slug', updateRestaurant);

// DELETE a restaurant
router.delete('/:slug', deleteRestaurant);

module.exports = router;