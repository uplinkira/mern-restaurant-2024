const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// **GET all dishes with pagination and search**
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? { name: new RegExp(search, 'i') } // Case-insensitive search by dish name
      : {};

    const [dishes, total] = await Promise.all([
      Dish.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }), // Sort by most recent dishes
      Dish.countDocuments(query), // Count total for pagination
    ]);

    res.status(200).json({
      dishes,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error fetching dishes:', error);
    res.status(500).json({ message: 'Failed to fetch dishes' });
  }
});

// **GET a dish by slug**
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const dish = await Dish.findOne({ slug }).populate('restaurant');
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.status(200).json(dish);
  } catch (error) {
    console.error('Error fetching dish by slug:', error);
    res.status(500).json({ message: 'Failed to fetch dish' });
  }
});

// **GET dishes by restaurant slug**
router.get('/restaurant/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const dishes = await Dish.find({ restaurant: restaurant._id });
    if (dishes.length === 0) {
      return res.status(404).json({ message: 'No dishes found for this restaurant' });
    }

    res.status(200).json(dishes);
  } catch (error) {
    console.error('Error fetching dishes for restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch dishes for restaurant' });
  }
});

// **Search dishes**
router.get('/search', async (req, res) => {
  try {
    const { keyword = '', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = keyword
      ? { name: new RegExp(keyword, 'i') } // Case-insensitive search
      : {};

    const [results, total] = await Promise.all([
      Dish.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Dish.countDocuments(query),
    ]);

    res.status(200).json({
      results,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error searching dishes:', error);
    res.status(500).json({ message: 'Failed to search dishes' });
  }
});

// **POST create a new dish**
router.post('/', async (req, res) => {
  const { name, description, price, restaurantSlug, slug } = req.body;
  try {
    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(400).json({ message: 'Restaurant not found' });
    }

    const dish = new Dish({
      name,
      description,
      price,
      restaurant: restaurant._id,
      slug,
    });

    await dish.save();
    res.status(201).json({ message: 'Dish created successfully', dish });
  } catch (error) {
    console.error('Error creating dish:', error);
    res.status(500).json({ message: 'Failed to create dish' });
  }
});

// **PUT update a dish by slug**
router.put('/:slug', async (req, res) => {
  const { slug } = req.params;
  const { name, description, price, restaurantSlug } = req.body;

  try {
    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(400).json({ message: 'Restaurant not found' });
    }

    const updatedDish = await Dish.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        price,
        restaurant: restaurant._id,
      },
      { new: true }
    );

    if (!updatedDish) {
      return res.status(404).json({ message: 'Dish not found' });
    }

    res.status(200).json({ message: 'Dish updated successfully', updatedDish });
  } catch (error) {
    console.error('Error updating dish:', error);
    res.status(500).json({ message: 'Failed to update dish' });
  }
});

// **DELETE a dish by slug**
router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const dish = await Dish.findOneAndDelete({ slug });
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.status(200).json({ message: 'Dish deleted successfully' });
  } catch (error) {
    console.error('Error deleting dish:', error);
    res.status(500).json({ message: 'Failed to delete dish' });
  }
});

module.exports = router;
