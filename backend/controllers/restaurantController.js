// backend/controllers/restaurantController.js
const Restaurant = require('../models/Restaurant');
const Menu = require('../models/Menu');
const Dish = require('../models/Dish');

// Utility functions
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  req.pagination = { skip: (page - 1) * limit, limit, page };
  next();
};

const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(`[${new Date().toISOString()}] ${message}:`, error);
  res.status(statusCode).json({ 
    success: false, 
    message, 
    error: error?.message || 'An error occurred' 
  });
};

// Main controller methods
const getAllRestaurants = async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const { 
    search = '', 
    cuisineType,
    priceRange,
    isVRExperience,
    status = 'active'
  } = req.query;

  try {
    const query = { status };

    if (search) {
      query.$text = { $search: search };
    }
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }
    if (priceRange) {
      query.priceRange = priceRange;
    }
    if (typeof isVRExperience === 'boolean') {
      query.isVRExperience = isVRExperience;
    }

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .select('name description cuisineType priceRange isVRExperience status rating images slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
      Restaurant.countDocuments(query)
    ]);

    successResponse(res, restaurants, { 
      total, 
      page, 
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    errorResponse(res, 'Error fetching restaurants', error);
  }
};

const getRestaurantBySlug = async (req, res) => {
  console.log('\n=== Restaurant Details Request ===');
  console.log('Params:', req.params);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);
  console.log('================================\n');
  
  const { slug } = req.params;
  const { includeDishes = true, includeMenus = true } = req.query;

  console.log('Getting restaurant details:', {
    slug,
    includeDishes,
    includeMenus,
    query: req.query
  });

  try {
    const restaurantQuery = Restaurant.findOne({ 
      slug,
      status: 'active'
    });

    if (includeMenus) {
      console.log('Including menus in query');
      restaurantQuery.populate({
        path: 'menuDetails',
        match: { status: 'active' },
        select: 'name slug description category type isVREnabled priceRange order',
        options: { sort: { order: 1 } }
      });

      if (includeDishes) {
        console.log('Including dishes in menus');
        restaurantQuery.populate({
          path: 'menuDetails',
          populate: {
            path: 'dishes',
            match: { status: 'active' },
            select: 'name slug price description isSignatureDish allergens ingredients chenPiAge images',
            options: { sort: { isSignatureDish: -1, name: 1 } }
          }
        });
      }
    }

    const restaurant = await restaurantQuery.lean();
    
    console.log('Restaurant query result:', {
      found: !!restaurant,
      hasMenus: restaurant?.menuDetails?.length,
      hasDishes: restaurant?.dishes?.length
    });

    console.log('Raw restaurant data:', JSON.stringify(restaurant, null, 2));

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    const response = {
      ...restaurant,
      menuDetails: restaurant.menuDetails || [],
      dishes: restaurant.dishes || []
    };

    console.log('Full response object:', JSON.stringify(response, null, 2));

    successResponse(res, response);
  } catch (error) {
    console.error('Restaurant fetch error:', {
      error,
      message: error.message,
      stack: error.stack
    });
    errorResponse(res, 'Error fetching restaurant details', error);
  }
};

const getDishesByRestaurant = async (req, res) => {
  const { slug } = req.params;
  const { status = 'active', category } = req.query;

  try {
    const restaurant = await Restaurant.findOne({ 
      slug, 
      status: 'active' 
    })
    .select('dishes')
    .lean();

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    const query = {
      slug: { $in: restaurant.dishes },
      status
    };

    if (category) {
      query.category = category;
    }

    const dishes = await Dish.find(query)
      .select('name slug price description isSignatureDish allergens ingredients chenPiAge images')
      .sort({ isSignatureDish: -1, name: 1 })
      .lean();

    successResponse(res, dishes);
  } catch (error) {
    errorResponse(res, 'Error fetching dishes for restaurant', error);
  }
};

const getMenusByRestaurant = async (req, res) => {
  const { slug } = req.params;
  const { 
    category,
    includeDishes = true,
    status = 'active'
  } = req.query;

  try {
    const restaurant = await Restaurant.findOne({ 
      slug,
      status: 'active'
    })
    .select('menus')
    .lean();

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    const menuQuery = Menu.findByRestaurant(slug, {
      category,
      status,
      includeDishes
    });

    const menus = await menuQuery;
    successResponse(res, menus);
  } catch (error) {
    errorResponse(res, 'Error fetching menus for restaurant', error);
  }
};

const createRestaurant = async (req, res) => {
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    
    const populatedRestaurant = await Restaurant.findOne({ slug: restaurant.slug })
      .populate('menuDetails')
      .populate('dishDetails')
      .lean();

    successResponse(res, populatedRestaurant, { 
      message: 'Restaurant created successfully' 
    });
  } catch (error) {
    errorResponse(res, 'Error creating restaurant', error);
  }
};

const updateRestaurant = async (req, res) => {
  const { slug } = req.params;

  try {
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { slug },
      req.body,
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('menuDetails')
    .populate('dishDetails')
    .lean();

    if (!updatedRestaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    successResponse(res, updatedRestaurant, { 
      message: 'Restaurant updated successfully' 
    });
  } catch (error) {
    errorResponse(res, 'Error updating restaurant', error);
  }
};

const deleteRestaurant = async (req, res) => {
  const { slug } = req.params;

  try {
    const restaurant = await Restaurant.findOne({ slug })
      .select('menus dishes')
      .lean();

    if (!restaurant) {
      return res.status(404).json({ 
        success: false, 
        message: 'Restaurant not found' 
      });
    }

    await Promise.all([
      Restaurant.findOneAndDelete({ slug }),
      Menu.updateMany(
        { slug: { $in: restaurant.menus } },
        { $pull: { restaurants: slug } }
      ),
      Dish.updateMany(
        { slug: { $in: restaurant.dishes } },
        { $pull: { restaurants: slug } }
      )
    ]);

    successResponse(res, { slug }, { 
      message: 'Restaurant deleted successfully' 
    });
  } catch (error) {
    errorResponse(res, 'Error deleting restaurant', error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllRestaurants,
  getRestaurantBySlug,
  getDishesByRestaurant,
  getMenusByRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
};