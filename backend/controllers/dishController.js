// backend/controllers/dishController.js
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');

// Enhanced utility functions
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(`[Dishes] Error: ${message}`, error);
  console.error('[Dishes] Stack:', error?.stack);
  
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' 
      ? error?.message || 'An error occurred'
      : 'Internal server error',
    timestamp: new Date().toISOString()
  });
};

// Enhanced pagination middleware with sorting
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const sortField = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;
  
  req.pagination = {
    skip: (page - 1) * limit,
    limit,
    page,
    sort: { [sortField]: sortOrder }
  };
  next();
};

// Get all dishes with enhanced filtering and pagination
const getAllDishes = async (req, res) => {
  const { skip, limit, page, sort } = req.pagination;
  const {
    restaurant,
    menu,
    minPrice,
    maxPrice,
    isSignature,
    status = 'active'
  } = req.query;

  console.log(`[Dishes] Fetching dishes with filters:`, req.query);

  try {
    // Build query
    const query = { status };
    if (restaurant) query.restaurants = restaurant;
    if (menu) query.menus = menu;
    if (minPrice) query.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    if (typeof isSignature === 'boolean') query.isSignatureDish = isSignature;

    // Execute query with populated data
    const [dishes, total] = await Promise.all([
      Dish.find(query)
        .populate('restaurantDetails', 'name slug cuisineType priceRange')
        .populate('menuDetails', 'name slug category')
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      Dish.countDocuments(query)
    ]);

    console.log(`[Dishes] Retrieved ${dishes.length} dishes out of ${total} total`);

    // Format response
    const formattedDishes = dishes.map(dish => ({
      ...dish,
      restaurants: dish.restaurantDetails,
      menus: dish.menuDetails,
      restaurantDetails: undefined,
      menuDetails: undefined
    }));

    successResponse(res, formattedDishes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      filters: {
        restaurant,
        menu,
        priceRange: minPrice || maxPrice ? { min: minPrice, max: maxPrice } : null,
        isSignature
      }
    });

  } catch (error) {
    errorResponse(res, 'Failed to fetch dishes', error);
  }
};

// Get dish by slug with enhanced related data
const getDishBySlug = async (req, res) => {
  const { slug } = req.params;
  const { includeRelated = true } = req.query;

  console.log(`[Dishes] Fetching dish: ${slug}, includeRelated: ${includeRelated}`);

  try {
    const dish = await Dish.findOne({ slug })
      .populate({
        path: 'restaurantDetails',
        select: 'name slug cuisineType priceRange images'
      })
      .populate({
        path: 'menuDetails',
        select: 'name slug category'
      })
      .lean();

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found',
        timestamp: new Date().toISOString()
      });
    }

    // Get related dishes if requested
    let relatedDishes = [];
    if (includeRelated) {
      relatedDishes = await Dish.find({
        restaurants: { $in: dish.restaurants },
        slug: { $ne: dish.slug },
        status: 'active'
      })
      .select('name slug price isSignatureDish images')
      .limit(4)
      .lean();
    }

    // Format response
    const formattedDish = {
      ...dish,
      restaurants: dish.restaurantDetails,
      menus: dish.menuDetails,
      relatedDishes,
      restaurantDetails: undefined,
      menuDetails: undefined
    };

    successResponse(res, formattedDish);

  } catch (error) {
    errorResponse(res, `Failed to fetch dish: ${slug}`, error);
  }
};

// Enhanced search with filters
const searchDishes = async (req, res) => {
  const { skip, limit, page, sort } = req.pagination;
  const {
    q,
    restaurant,
    menu,
    minPrice,
    maxPrice,
    isSignature,
    status = 'active'
  } = req.query;

  try {
    const query = { status };

    // Text search if query provided
    if (q?.trim()) {
      query.$text = { $search: q.trim() };
    }

    // Apply filters
    if (restaurant) query.restaurants = restaurant;
    if (menu) query.menus = menu;
    if (minPrice) query.price = { $gte: parseFloat(minPrice) };
    if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
    if (typeof isSignature === 'boolean') query.isSignatureDish = isSignature;

    const [dishes, total] = await Promise.all([
      Dish.find(query)
        .populate('restaurantDetails', 'name slug')
        .populate('menuDetails', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort(sort)
        .lean(),
      Dish.countDocuments(query)
    ]);

    // Format response
    const formattedDishes = dishes.map(dish => ({
      ...dish,
      restaurants: dish.restaurantDetails,
      menus: dish.menuDetails,
      restaurantDetails: undefined,
      menuDetails: undefined
    }));

    successResponse(res, formattedDishes, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      searchTerm: q
    });

  } catch (error) {
    errorResponse(res, 'Search failed', error);
  }
};

// Create dish with enhanced validation
const createDish = async (req, res) => {
  const dishData = req.body;

  console.log('[Dishes] Creating new dish:', dishData.name);

  try {
    // Validate references
    const [restaurantDocs, menuDocs] = await Promise.all([
      Restaurant.find({ 
        slug: { $in: dishData.restaurants },
        status: 'active'
      }),
      Menu.find({ 
        slug: { $in: dishData.menus },
        status: 'active'
      })
    ]);

    if (restaurantDocs.length !== dishData.restaurants.length) {
      return res.status(400).json({
        success: false,
        message: 'Some restaurants not found or inactive',
        invalidRestaurants: dishData.restaurants.filter(
          slug => !restaurantDocs.find(doc => doc.slug === slug)
        )
      });
    }

    if (menuDocs.length !== dishData.menus.length) {
      return res.status(400).json({
        success: false,
        message: 'Some menus not found or inactive',
        invalidMenus: dishData.menus.filter(
          slug => !menuDocs.find(doc => doc.slug === slug)
        )
      });
    }

    // Create dish
    const dish = new Dish(dishData);
    await dish.save();

    // Update restaurant and menu references
    await Promise.all([
      ...restaurantDocs.map(restaurant => restaurant.addDish(dish.slug)),
      ...menuDocs.map(menu => menu.addDish(dish.slug))
    ]);

    // Fetch complete dish data
    const completeDish = await Dish.findById(dish._id)
      .populate('restaurantDetails', 'name slug')
      .populate('menuDetails', 'name slug')
      .lean();

    successResponse(res, completeDish, { 
      message: 'Dish created successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', error, 400);
    }
    errorResponse(res, 'Failed to create dish', error);
  }
};

// Update dish with enhanced validation and reference management
const updateDish = async (req, res) => {
  const { slug } = req.params;
  const updates = req.body;

  console.log(`[Dishes] Updating dish: ${slug}`);

  try {
    const dish = await Dish.findOne({ slug });
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    // If updating references, validate them
    if (updates.restaurants || updates.menus) {
      const [restaurantDocs, menuDocs] = await Promise.all([
        Restaurant.find({ 
          slug: { $in: updates.restaurants || dish.restaurants },
          status: 'active'
        }),
        Menu.find({ 
          slug: { $in: updates.menus || dish.menus },
          status: 'active'
        })
      ]);

      // Validate restaurants
      if (updates.restaurants && 
          restaurantDocs.length !== updates.restaurants.length) {
        return res.status(400).json({
          success: false,
          message: 'Some restaurants not found or inactive',
          invalidRestaurants: updates.restaurants.filter(
            slug => !restaurantDocs.find(doc => doc.slug === slug)
          )
        });
      }

      // Validate menus
      if (updates.menus && menuDocs.length !== updates.menus.length) {
        return res.status(400).json({
          success: false,
          message: 'Some menus not found or inactive',
          invalidMenus: updates.menus.filter(
            slug => !menuDocs.find(doc => doc.slug === slug)
          )
        });
      }

      // Handle reference updates
      if (updates.restaurants) {
        const removedRestaurants = dish.restaurants.filter(
          slug => !updates.restaurants.includes(slug)
        );
        const addedRestaurants = updates.restaurants.filter(
          slug => !dish.restaurants.includes(slug)
        );

        await Promise.all([
          ...removedRestaurants.map(slug => 
            Restaurant.findOne({ slug }).then(r => r?.removeDish(dish.slug))
          ),
          ...addedRestaurants.map(slug =>
            Restaurant.findOne({ slug }).then(r => r?.addDish(dish.slug))
          )
        ]);
      }

      if (updates.menus) {
        const removedMenus = dish.menus.filter(
          slug => !updates.menus.includes(slug)
        );
        const addedMenus = updates.menus.filter(
          slug => !dish.menus.includes(slug)
        );

        await Promise.all([
          ...removedMenus.map(slug => 
            Menu.findOne({ slug }).then(m => m?.removeDish(dish.slug))
          ),
          ...addedMenus.map(slug =>
            Menu.findOne({ slug }).then(m => m?.addDish(dish.slug))
          )
        ]);
      }
    }

    // Update dish
    Object.assign(dish, updates);
    await dish.save();

    // Fetch updated dish with populated data
    const updatedDish = await Dish.findById(dish._id)
      .populate('restaurantDetails', 'name slug')
      .populate('menuDetails', 'name slug')
      .lean();

    successResponse(res, updatedDish, {
      message: 'Dish updated successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', error, 400);
    }
    errorResponse(res, `Failed to update dish: ${slug}`, error);
  }
};

// Delete dish with reference cleanup
const deleteDish = async (req, res) => {
  const { slug } = req.params;
  const { hardDelete = false } = req.query;

  console.log(`[Dishes] ${hardDelete ? 'Deleting' : 'Deactivating'} dish: ${slug}`);

  try {
    const dish = await Dish.findOne({ slug });
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish not found'
      });
    }

    if (hardDelete) {
      // Clean up references
      await Promise.all([
        ...dish.restaurants.map(restaurantSlug =>
          Restaurant.findOne({ slug: restaurantSlug }).then(r => r?.removeDish(slug))
        ),
        ...dish.menus.map(menuSlug =>
          Menu.findOne({ slug: menuSlug }).then(m => m?.removeDish(slug))
        )
      ]);

      await dish.deleteOne();
    } else {
      // Soft delete
      dish.status = 'inactive';
      await dish.save();
    }

    successResponse(res, null, {
      message: `Dish ${hardDelete ? 'deleted' : 'deactivated'} successfully`
    });

  } catch (error) {
    errorResponse(res, `Failed to ${hardDelete ? 'delete' : 'deactivate'} dish: ${slug}`, error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllDishes,
  getDishBySlug,
  searchDishes,
  createDish,
  updateDish,
  deleteDish
};