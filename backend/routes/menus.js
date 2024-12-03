// backend/routes/menus.js
const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

// **GET all menus with pagination and search functionality**
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const query = search
      ? {
          $or: [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
          ],
        }
      : {};

    // Fetch menus with pagination and optional search
    const menus = await Menu.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }) // Sort by most recent menus
      .populate('restaurants'); // Populate related restaurant data

    // Get the total count of menus to calculate pagination info
    const total = await Menu.countDocuments(query);

    res.status(200).json({
      menus,
      total,
      page: Number(page),
      limit: Number(limit),
    });
  } catch (error) {
    console.error('Error fetching menus:', error);
    res.status(500).json({ message: 'Failed to fetch menus' });
  }
});

// **GET a single menu by slug**
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const menu = await Menu.findOne({ slug }).populate('restaurants');
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.status(200).json(menu);
  } catch (error) {
    console.error('Error fetching menu by slug:', error);
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
});

// **POST create a new menu**
router.post('/', async (req, res) => {
  const { name, description, restaurants, slug } = req.body;
  try {
    const restaurantSlugs = restaurants || [];
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurantSlugs } });

    if (restaurantDocs.length !== restaurantSlugs.length) {
      return res.status(400).json({ message: 'Some restaurants not found' });
    }

    const menu = new Menu({
      name,
      description,
      restaurants: restaurantDocs.map((restaurant) => restaurant.slug),
      slug,
    });

    await menu.save();
    res.status(201).json({ message: 'Menu created successfully', menu });
  } catch (error) {
    console.error('Error creating menu:', error);
    res.status(500).json({ message: 'Failed to create menu' });
  }
});

// **PUT update a menu by slug**
router.put('/:slug', async (req, res) => {
  const { slug } = req.params;
  const { name, description, restaurants } = req.body;
  try {
    const restaurantSlugs = restaurants || [];
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurantSlugs } });

    if (restaurantDocs.length !== restaurantSlugs.length) {
      return res.status(400).json({ message: 'Some restaurants not found' });
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        restaurants: restaurantDocs.map((restaurant) => restaurant.slug),
      },
      { new: true }
    ).populate('restaurants');

    if (!updatedMenu) {
      return res.status(404).json({ message: 'Menu not found' });
    }

    res.status(200).json({ message: 'Menu updated successfully', updatedMenu });
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ message: 'Failed to update menu' });
  }
});

// **DELETE a menu by slug**
router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const menu = await Menu.findOneAndDelete({ slug });
    if (!menu) {
      return res.status(404).json({ message: 'Menu not found' });
    }
    res.status(200).json({ message: 'Menu deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu:', error);
    res.status(500).json({ message: 'Failed to delete menu' });
  }
});

// **GET menus by restaurant slug**
router.get('/restaurant/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const menus = await Menu.find({ restaurants: slug }).populate('restaurants');
    if (!menus.length) {
      return res.status(404).json({ message: 'No menus found for this restaurant' });
    }
    res.status(200).json(menus);
  } catch (error) {
    console.error('Error fetching menus for restaurant:', error);
    res.status(500).json({ message: 'Failed to fetch menus for restaurant' });
  }
});

module.exports = router;
