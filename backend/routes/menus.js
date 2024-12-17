// backend/routes/menus.js
const express = require('express');
const router = express.Router();
const {
  applyPagination,
  getAllMenus,
  getMenuBySlug,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenusByRestaurant
} = require('../controllers/menuController');

// Validation middleware for menu input
const validateMenuInput = (req, res, next) => {
  const { name, description, restaurants, category } = req.body;
  
  const errors = [];
  
  if (!name?.trim()) errors.push('Name is required');
  if (!description?.trim()) errors.push('Description is required');
  if (!Array.isArray(restaurants) || !restaurants.length) {
    errors.push('At least one restaurant is required');
  }
  if (!category) errors.push('Category is required');

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Apply pagination to all routes that need it
router.use([
  '/',
  '/search',
  '/restaurant/:slug'
], applyPagination);

// Core Routes
router.get('/', getAllMenus);

router.get('/search', async (req, res) => {
  req.query.search = req.query.q;
  return getAllMenus(req, res);
});

router.get('/:slug', getMenuBySlug);

router.post('/', 
  validateMenuInput,
  createMenu
);

router.put('/:slug',
  validateMenuInput,
  updateMenu
);

router.delete('/:slug', deleteMenu);

// Specialized Routes
router.get('/restaurant/:slug', getMenusByRestaurant);

// Additional Menu Operations
router.patch('/:slug/status', async (req, res) => {
  const { slug } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'seasonal'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status value'
    });
  }

  try {
    const menu = await Menu.findOneAndUpdate(
      { slug },
      { status },
      { 
        new: true,
        runValidators: true 
      }
    )
    .populate('restaurants', 'name slug cuisineType')
    .populate({
      path: 'dishes',
      match: { status: 'active' },
      select: 'name slug price isSignatureDish'
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: menu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

router.patch('/:slug/dishes', async (req, res) => {
  const { slug } = req.params;
  const { add, remove } = req.body;

  try {
    const menu = await Menu.findOne({ slug });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    if (Array.isArray(add) && add.length) {
      await Promise.all(add.map(dishSlug => menu.addDish(dishSlug)));
    }

    if (Array.isArray(remove) && remove.length) {
      await Promise.all(remove.map(dishSlug => menu.removeDish(dishSlug)));
    }

    const updatedMenu = await Menu.findOne({ slug })
      .populate('restaurants', 'name slug cuisineType')
      .populate({
        path: 'dishes',
        match: { status: 'active' },
        select: 'name slug price isSignatureDish'
      });

    res.status(200).json({
      success: true,
      message: 'Menu dishes updated successfully',
      data: updatedMenu
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update menu dishes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Category-specific routes
router.get('/category/:category', applyPagination, async (req, res) => {
  req.query.category = req.params.category;
  return getAllMenus(req, res);
});

// VR-specific routes
router.get('/vr-experience', applyPagination, async (req, res) => {
  req.query.isVREnabled = true;
  return getAllMenus(req, res);
});

// Seasonal menus
router.get('/seasonal', applyPagination, async (req, res) => {
  req.query.type = 'seasonal';
  return getAllMenus(req, res);
});

module.exports = router;