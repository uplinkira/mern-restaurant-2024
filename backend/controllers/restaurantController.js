
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get restaurant by ID and include associated dishes
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('dishes');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get dishes for a specific restaurant
const getRestaurantDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurant: req.params.id });
    res.json(dishes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search restaurants and dishes
const searchRestaurantsAndDishes = async (req, res) => {
  const { q } = req.query;
  try {
    const regex = new RegExp(q, 'i');
    const restaurants = await Restaurant.find({
      $or: [
        { name: regex },
        { description: regex },
        { cuisineType: regex }
      ]
    });
    const dishes = await Dish.find({
      $or: [
        { name: regex },
        { description: regex }
      ]
    }).populate('restaurant', 'name');
    res.json({ restaurants, dishes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantDishes,
  searchRestaurantsAndDishes
};
