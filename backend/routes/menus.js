const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

// **GET all menus**
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find().populate('restaurants');
    res.status(200).json(menus);
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
    console.error('Error fetching menu:', error);
    res.status(500).json({ message: 'Failed to fetch menu' });
  }
});

// **POST create a new menu**
router.post('/', async (req, res) => {
  const { name, description, restaurants, slug } = req.body;
  try {
    const restaurantIds = await Restaurant.find({ name: { $in: restaurants } }).select('_id');
    const menu = new Menu({
      name,
      description,
      restaurants: restaurantIds.map(restaurant => restaurant._id),
      slug
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
    const restaurantIds = await Restaurant.find({ name: { $in: restaurants } }).select('_id');
    const updatedMenu = await Menu.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        restaurants: restaurantIds.map(restaurant => restaurant._id),
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

// **GET menus by restaurant**
router.get('/restaurant/:restaurantId', async (req, res) => {
  const { restaurantId } = req.params;
  try {
    const menus = await Menu.findByRestaurant(restaurantId);
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
