// backend/routes/dishes.js
const express = require('express');
const router = express.Router();
const {
  applyPagination,
  getAllDishes,
  getDishBySlug,
  searchDishes,
  createDish,
  updateDish,
  deleteDish
} = require('../controllers/dishController');

// Validation middleware
const validateDishInput = (req, res, next) => {
  const { name, description, price, restaurants, menus } = req.body;
  
  const errors = [];
  
  if (!name?.trim()) errors.push('Name is required');
  if (!description?.trim()) errors.push('Description is required');
  if (!price || price < 0) errors.push('Valid price is required');
  if (!Array.isArray(restaurants) || !restaurants.length) errors.push('At least one restaurant is required');
  if (!Array.isArray(menus) || !menus.length) errors.push('At least one menu is required');

  if (errors.length) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

// Routes
router.get(
  '/search',
  applyPagination,
  searchDishes
);

router.get(
  '/',
  applyPagination,
  getAllDishes
);

router.get(
  '/:slug',
  getDishBySlug
);

router.get(
  '/restaurant/:slug',
  applyPagination,
  async (req, res) => {
    const { slug } = req.params;
    const { skip, limit, page, sort } = req.pagination;
    const { status = 'active' } = req.query;

    try {
      const [dishes, total] = await Promise.all([
        Dish.find({ restaurants: slug, status })
          .populate('restaurantDetails', 'name slug cuisineType')
          .populate('menuDetails', 'name slug')
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        Dish.countDocuments({ restaurants: slug, status })
      ]);

      res.status(200).json({
        success: true,
        data: dishes.map(dish => ({
          ...dish,
          restaurants: dish.restaurantDetails,
          menus: dish.menuDetails,
          restaurantDetails: undefined,
          menuDetails: undefined
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          restaurant: slug
        }
      });
    } catch (error) {
      console.error('Error fetching restaurant dishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch restaurant dishes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

router.get(
  '/menu/:slug',
  applyPagination,
  async (req, res) => {
    const { slug } = req.params;
    const { skip, limit, page, sort } = req.pagination;
    const { status = 'active' } = req.query;

    try {
      const [dishes, total] = await Promise.all([
        Dish.find({ menus: slug, status })
          .populate('restaurantDetails', 'name slug cuisineType')
          .populate('menuDetails', 'name slug')
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .lean(),
        Dish.countDocuments({ menus: slug, status })
      ]);

      res.status(200).json({
        success: true,
        data: dishes.map(dish => ({
          ...dish,
          restaurants: dish.restaurantDetails,
          menus: dish.menuDetails,
          restaurantDetails: undefined,
          menuDetails: undefined
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          menu: slug
        }
      });
    } catch (error) {
      console.error('Error fetching menu dishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch menu dishes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

router.post(
  '/',
  validateDishInput,
  createDish
);

router.put(
  '/:slug',
  validateDishInput,
  updateDish
);

router.delete(
  '/:slug',
  deleteDish
);

// Specialized routes
router.get(
  '/signature/:restaurantSlug',
  async (req, res) => {
    const { restaurantSlug } = req.params;
    const { status = 'active' } = req.query;

    try {
      const dishes = await Dish.find({
        restaurants: restaurantSlug,
        isSignatureDish: true,
        status
      })
      .populate('restaurantDetails', 'name slug cuisineType')
      .populate('menuDetails', 'name slug')
      .lean();

      res.status(200).json({
        success: true,
        data: dishes.map(dish => ({
          ...dish,
          restaurants: dish.restaurantDetails,
          menus: dish.menuDetails,
          restaurantDetails: undefined,
          menuDetails: undefined
        }))
      });
    } catch (error) {
      console.error('Error fetching signature dishes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch signature dishes',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

router.patch(
  '/:slug/status',
  async (req, res) => {
    const { slug } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'seasonal'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    try {
      const dish = await Dish.findOneAndUpdate(
        { slug },
        { status },
        { new: true }
      )
      .populate('restaurantDetails', 'name slug')
      .populate('menuDetails', 'name slug')
      .lean();

      if (!dish) {
        return res.status(404).json({
          success: false,
          message: 'Dish not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Status updated successfully',
        data: {
          ...dish,
          restaurants: dish.restaurantDetails,
          menus: dish.menuDetails,
          restaurantDetails: undefined,
          menuDetails: undefined
        }
      });
    } catch (error) {
      console.error('Error updating dish status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update dish status',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;