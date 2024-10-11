const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Product = require('../models/Product');

// Get all restaurants
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Error fetching restaurants' });
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
    console.error('Error fetching restaurant by ID:', error);
    res.status(500).json({ message: 'Error fetching restaurant details' });
  }
};

// Get dishes for a specific restaurant
const getRestaurantDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurant: req.params.id });
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ message: 'Error fetching dishes' });
  }
};

// Search restaurants, dishes, and products
const searchRestaurantsDishesAndProducts = async (req, res) => {
  const { q } = req.query;
  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const regex = new RegExp(q, 'i');

    // Search for restaurants
    const restaurants = await Restaurant.find({
      $or: [
        { name: regex },
        { description: regex },
        { cuisineType: regex }
      ]
    });

    // Search for dishes
    const dishes = await Dish.find({
      $or: [
        { name: regex },
        { description: regex }
      ]
    }).populate('restaurant', 'name');

    // Search for products
    const products = await Product.find({
      $or: [
        { name: regex },
        { description: regex },
        { category: regex }
      ]
    });

    if (!restaurants.length && !dishes.length && !products.length) {
      return res.status(404).json({ message: 'No results found for your search query.' });
    }

    // Return all results in one response
    res.json({ restaurants, dishes, products });
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ message: 'Error occurred during search' });
  }
};

module.exports = {
  getAllRestaurants,
  getRestaurantById,
  getRestaurantDishes,
  searchRestaurantsDishesAndProducts
};
