// backend/routes/restaurants.js
const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Dish = require('../models/Dish');

// **GET all restaurants with pagination and search**
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { cuisineType: new RegExp(search, 'i') },
          ],
        }
      : {};

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Restaurant.countDocuments(query),
    ]);

    res.status(200).json({ restaurants, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Failed to fetch restaurants' });
  }
});

// **GET a single restaurant by slug with details**
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ slug })
      .populate('dishDetails')
      .populate('menuDetails');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant' });
  }
});

// **GET dishes for a specific restaurant by slug**
router.get('/:slug/dishes', async (req, res) => {
  const { slug } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ slug }).select('dishes');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const dishes = await Dish.find({ slug: { $in: restaurant.dishes } });
    res.status(200).json(dishes);
  } catch (error) {
    console.error('Error fetching dishes for restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch dishes for restaurant' });
  }
});

// **GET menus for a specific restaurant by slug**
router.get('/:slug/menus', async (req, res) => {
  const { slug } = req.params;
  try {
    const restaurant = await Restaurant.findOne({ slug }).select('menus');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menus = await Menu.find({ slug: { $in: restaurant.menus } });
    res.status(200).json(menus);
  } catch (error) {
    console.error('Error fetching menus for restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch menus for restaurant' });
  }
});

// **POST create a new restaurant**
router.post('/', async (req, res) => {
  const {
    name,
    description,
    cuisineType,
    address,
    phone,
    email,
    website,
    openingHours,
    specialties,
    isVRExperience,
    maxCapacity,
    priceRange,
    slug,
  } = req.body;

  try {
    const restaurant = new Restaurant({
      name,
      description,
      cuisineType,
      address,
      phone,
      email,
      website,
      openingHours,
      specialties,
      isVRExperience,
      maxCapacity,
      priceRange,
      slug,
    });

    await restaurant.save();
    res.status(201).json({ message: 'Restaurant created successfully', restaurant });
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Failed to create restaurant' });
  }
});

// **PUT update a restaurant by slug**
router.put('/:slug', async (req, res) => {
  const { slug } = req.params;
  const {
    name,
    description,
    cuisineType,
    address,
    phone,
    email,
    website,
    openingHours,
    specialties,
    isVRExperience,
    maxCapacity,
    priceRange,
  } = req.body;

  try {
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        cuisineType,
        address,
        phone,
        email,
        website,
        openingHours,
        specialties,
        isVRExperience,
        maxCapacity,
        priceRange,
      },
      { new: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.status(200).json({ message: 'Restaurant updated successfully', updatedRestaurant });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Failed to update restaurant' });
  }
});

// **DELETE a restaurant by slug**
router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const restaurant = await Restaurant.findOneAndDelete({ slug });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.status(200).json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Failed to delete restaurant' });
  }
});

module.exports = router;
