const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Product = require('../models/Product');
const Menu = require('../models/Menu');

// Get all restaurants with basic dish information
const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find()
      .populate('dishes', 'name'); // Populate dish names associated with each restaurant
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Error fetching restaurants' });
  }
};

// Get restaurant by ID with associated dishes and menus information
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate({
        path: 'dishes',
        populate: { path: 'menus', select: 'name description' }, 
      })
      .populate('menus', 'name description');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    res.status(500).json({ message: 'Error fetching restaurant details' });
  }
};

// Get all dishes for a specific restaurant
const getRestaurantDishes = async (req, res) => {
  try {
    const dishes = await Dish.find({ restaurants: req.params.slug }) // Fetch dishes using the restaurant's slug
      .populate('menus', 'name description') 
      .populate('restaurants', 'name');

    if (!dishes.length) {
      return res.status(404).json({ message: 'No dishes found for this restaurant.' });
    }

    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ message: 'Error fetching dishes' });
  }
};

// Search across restaurants, dishes, and products with a query
const searchRestaurantsDishesAndProducts = async (req, res) => {
  const { q } = req.query;

  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const regex = new RegExp(q, 'i');

    // Search for restaurants by name, description, or cuisine type
    const restaurants = await Restaurant.find({
      $or: [{ name: regex }, { description: regex }, { cuisineType: regex }],
    });

    // Search for dishes and populate related restaurant and menu data
    const dishes = await Dish.find({
      $or: [{ name: regex }, { description: regex }],
    })
      .populate('restaurants', 'name')
      .populate('menus', 'name description');

    // Search for products by name, description, or category
    const products = await Product.find({
      $or: [{ name: regex }, { description: regex }, { category: regex }],
    });

    if (!restaurants.length && !dishes.length && !products.length) {
      return res.status(404).json({ message: 'No results found for your search query.' });
    }

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
  searchRestaurantsDishesAndProducts,
};
