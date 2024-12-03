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
  console.log(`[Dishes] Fetching dishes with pagination - page: ${page}, limit: ${limit}, skip: ${skip}`);

  try {
    // Get dishes with populated data
    const dishes = await Dish.find()
      .populate('restaurantDetails', 'name slug cuisineType')
      .populate('menuDetails', 'name slug')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Dish.countDocuments();

    // Log retrieval details
    console.log(`[Dishes] Retrieved ${dishes.length} dishes out of ${total} total`);
    
    if (dishes.length > 0) {
      console.log('[Dishes] Sample dish data:', {
        name: dishes[0].name,
        slug: dishes[0].slug,
        price: dishes[0].price,
        restaurantCount: dishes[0].restaurantDetails?.length || 0,
        menuCount: dishes[0].menuDetails?.length || 0
      });
    }

    // Format response to match frontend expectations
    const response = {
      success: true,
      data: dishes.map(dish => ({
        ...dish.toJSON(),
        restaurants: dish.restaurantDetails,
        menus: dish.menuDetails?.map(menu => menu.name) || []
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };

    console.log(`[Dishes] Sending response with ${response.data.length} dishes`);
    return res.status(200).json(response);

  } catch (error) {
    console.error('[Dishes] Error in getAllDishes:', error);
    console.error('[Dishes] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dishes',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get a single dish by slug
const getDishBySlug = async (req, res) => {
  const { slug } = req.params;
  console.log(`[Dishes] Fetching dish details for slug: ${slug}`);

  try {
    const dish = await Dish.findOne({ slug })
      .populate('restaurantDetails', 'name slug cuisineType')
      .populate('menuDetails', 'name slug')
      .populate('relatedDishes', 'name slug price');

    if (!dish) {
      console.log(`[Dishes] No dish found with slug: ${slug}`);
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    console.log(`[Dishes] Found dish: ${dish.name}`);
    console.log('[Dishes] Associated data:', {
      restaurantCount: dish.restaurantDetails?.length || 0,
      menuCount: dish.menuDetails?.length || 0,
      relatedDishCount: dish.relatedDishes?.length || 0
    });

    // Format response to match frontend expectations
    const response = {
      success: true,
      data: {
        ...dish.toJSON(),
        restaurants: dish.restaurantDetails,
        menus: dish.menuDetails?.map(menu => menu.name) || [],
        relatedDishes: dish.relatedDishes || []
      }
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error(`[Dishes] Error fetching dish ${slug}:`, error);
    console.error('[Dishes] Stack trace:', error.stack);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dish details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
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
