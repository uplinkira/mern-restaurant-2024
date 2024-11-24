const Dish = require('../models/Dish');

// Get all dishes
const getAllDishes = async (req, res) => {
  try {
    const dishes = await Dish.find()
      .populate('restaurantDetails', 'name')  // Populating restaurant names using virtual field
      .populate('menuDetails', 'name description');  // Populating menu names and descriptions using virtual field
    res.json(dishes);
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ message: 'Failed to fetch dishes' });
  }
};

// Get dish by ID
const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
      .populate('restaurantDetails', 'name')  // Populating restaurant names using virtual field
      .populate('menuDetails', 'name description');  // Populating menu names and descriptions using virtual field
    
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    
    res.json(dish);
  } catch (error) {
    console.error('Error fetching dish:', error);
    res.status(500).json({ message: 'Error fetching dish' });
  }
};

// Search dishes
const searchDishes = async (req, res) => {
  const { q } = req.query;
  
  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const regex = new RegExp(q, 'i');  // Case-insensitive search
    const dishes = await Dish.find({
      $or: [{ name: regex }, { description: regex }]
    })
      .populate('restaurantDetails', 'name')  // Populating restaurant names using virtual field
      .populate('menuDetails', 'name description');  // Populating menu names and descriptions using virtual field

    if (!dishes.length) {
      return res.status(404).json({ message: 'No dishes found matching your search.' });
    }

    res.json(dishes);
  } catch (error) {
    console.error('Error during dish search:', error);
    res.status(500).json({ message: 'Error during dish search' });
  }
};

module.exports = {
  getAllDishes,
  getDishById,
  searchDishes,
};
