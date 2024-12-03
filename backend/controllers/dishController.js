// backend/controllers/dishController.js
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// Utility function for standardized responses
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ success: false, message, error: error?.message || 'An error occurred' });
};

// Middleware for pagination
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  req.pagination = { skip: (page - 1) * limit, limit, page };
  next();
};

// Get all dishes with pagination
const getAllDishes = async (req, res) => {
  const { skip, limit, page } = req.pagination;

  try {
    const dishes = await Dish.find()
      .populate('restaurantDetails', 'name slug') // Populate restaurant details
      .populate('menuDetails', 'name slug') // Populate menu details
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Dish.countDocuments();
    successResponse(res, dishes, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching dishes', error);
  }
};

// Get a single dish by slug
const getDishBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const dish = await Dish.findOne({ slug })
      .populate('restaurantDetails', 'name slug') // Populate restaurant details
      .populate('menuDetails', 'name slug'); // Populate menu details

    if (!dish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

    successResponse(res, dish);
  } catch (error) {
    errorResponse(res, 'Error fetching dish by slug', error);
  }
};

// Search dishes by name or description
const searchDishes = async (req, res) => {
  const { q } = req.query;
  const { skip, limit, page } = req.pagination;

  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const dishes = await Dish.find({ $or: [{ name: regex }, { description: regex }] })
      .populate('restaurantDetails', 'name slug')
      .populate('menuDetails', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Dish.countDocuments({ $or: [{ name: regex }, { description: regex }] });

    successResponse(res, dishes, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error searching dishes', error);
  }
};

// Create a new dish
const createDish = async (req, res) => {
  const { name, description, price, restaurants, menus, slug, ingredients, allergens, chenPiAge, isSignatureDish } = req.body;

  try {
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurants } });
    if (restaurantDocs.length !== restaurants.length) {
      return res.status(400).json({ success: false, message: 'Some restaurants not found' });
    }

    const dish = new Dish({
      name,
      description,
      price,
      restaurants: restaurantDocs.map(r => r.slug),
      menus,
      slug,
      ingredients,
      allergens,
      chenPiAge,
      isSignatureDish,
    });

    await dish.save();
    successResponse(res, dish, { message: 'Dish created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating dish', error);
  }
};

// Update a dish by slug
const updateDish = async (req, res) => {
  const { slug } = req.params;
  const { name, description, price, restaurants, menus, ingredients, allergens, chenPiAge, isSignatureDish } = req.body;

  try {
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurants } });
    if (restaurantDocs.length !== restaurants.length) {
      return res.status(400).json({ success: false, message: 'Some restaurants not found' });
    }

    const updatedDish = await Dish.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        price,
        restaurants: restaurantDocs.map(r => r.slug),
        menus,
        ingredients,
        allergens,
        chenPiAge,
        isSignatureDish,
      },
      { new: true }
    );

    if (!updatedDish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

    successResponse(res, updatedDish, { message: 'Dish updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating dish', error);
  }
};

// Delete a dish by slug
const deleteDish = async (req, res) => {
  const { slug } = req.params;

  try {
    const deletedDish = await Dish.findOneAndDelete({ slug });
    if (!deletedDish) {
      return res.status(404).json({ success: false, message: 'Dish not found' });
    }

    successResponse(res, null, { message: 'Dish deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Error deleting dish', error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllDishes,
  getDishBySlug,
  searchDishes,
  createDish,
  updateDish,
  deleteDish,
};
