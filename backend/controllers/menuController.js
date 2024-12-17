// backend/controllers/menuController.js
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');

// Enhanced pagination with sorting and filtering
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100);
  const sortField = req.query.sortBy || 'order';
  const sortOrder = req.query.order === 'asc' ? 1 : -1;
  
  req.pagination = {
    skip: (page - 1) * limit,
    limit,
    page,
    sort: { [sortField]: sortOrder }
  };
  next();
};

// Enhanced response utilities
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
  console.error(`[Menu Controller Error]: ${message}`, error);
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error?.message : 'An error occurred',
    timestamp: new Date().toISOString()
  });
};

// Enhanced menu controllers
const getAllMenus = async (req, res) => {
  const { skip, limit, page, sort } = req.pagination;
  const {
    search,
    restaurant,
    category,
    type,
    status = 'active',
    isVREnabled
  } = req.query;

  try {
    const query = { status };

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') }
      ];
    }
    if (restaurant) query.restaurants = restaurant;
    if (category) query.category = category;
    if (type) query.type = type;
    if (isVREnabled !== undefined) query.isVREnabled = isVREnabled === 'true';

    const [menus, total] = await Promise.all([
      Menu.find(query)
        .populate('restaurants', 'name slug cuisineType isVRExperience')
        .populate({
          path: 'dishes',
          match: { status: 'active' },
          select: 'name slug price isSignatureDish'
        })
        .select('-__v')
        .skip(skip)
        .limit(limit)
        .sort(sort),
      Menu.countDocuments(query)
    ]);

    successResponse(res, menus, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      filters: {
        restaurant,
        category,
        type,
        status,
        isVREnabled
      }
    });
  } catch (error) {
    errorResponse(res, 'Error fetching menus', error);
  }
};

const getMenuBySlug = async (req, res) => {
  const { slug } = req.params;
  const { includeDishes = true } = req.query;

  try {
    const query = Menu.findOne({ slug })
      .populate('restaurants', 'name slug cuisineType isVRExperience')
      .select('-__v');

    if (includeDishes) {
      query.populate({
        path: 'dishes',
        match: { status: 'active' },
        select: 'name slug price description isSignatureDish',
        options: { sort: { isSignatureDish: -1, name: 1 } }
      });
    }

    const menu = await query.exec();

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found',
        timestamp: new Date().toISOString()
      });
    }

    successResponse(res, menu);
  } catch (error) {
    errorResponse(res, `Error fetching menu: ${slug}`, error);
  }
};

const createMenu = async (req, res) => {
  const menuData = req.body;

  try {
    // Validate restaurant references
    const restaurantDocs = await Restaurant.find({
      slug: { $in: menuData.restaurants },
      status: 'active'
    });

    if (restaurantDocs.length !== menuData.restaurants.length) {
      return res.status(400).json({
        success: false,
        message: 'Some restaurants not found or inactive',
        invalidRestaurants: menuData.restaurants.filter(
          slug => !restaurantDocs.find(doc => doc.slug === slug)
        )
      });
    }

    // VR validation
    if (menuData.isVREnabled) {
      const vrRestaurants = restaurantDocs.filter(r => r.isVRExperience);
      if (vrRestaurants.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'VR-enabled menus must be associated with VR-capable restaurants'
        });
      }
    }

    const menu = new Menu(menuData);
    await menu.save();

    // Update restaurant references
    await Promise.all(
      restaurantDocs.map(restaurant => restaurant.addMenu(menu.slug))
    );

    const completedMenu = await Menu.findById(menu._id)
      .populate('restaurants', 'name slug cuisineType')
      .lean();

    successResponse(res, completedMenu, {
      message: 'Menu created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', error, 400);
    }
    errorResponse(res, 'Failed to create menu', error);
  }
};

const updateMenu = async (req, res) => {
  const { slug } = req.params;
  const updates = req.body;

  try {
    const menu = await Menu.findOne({ slug });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    // Handle restaurant references
    if (updates.restaurants) {
      const restaurantDocs = await Restaurant.find({
        slug: { $in: updates.restaurants },
        status: 'active'
      });

      if (restaurantDocs.length !== updates.restaurants.length) {
        return res.status(400).json({
          success: false,
          message: 'Some restaurants not found or inactive',
          invalidRestaurants: updates.restaurants.filter(
            slug => !restaurantDocs.find(doc => doc.slug === slug)
          )
        });
      }

      // Handle removed and added restaurants
      const removedRestaurants = menu.restaurants.filter(
        slug => !updates.restaurants.includes(slug)
      );
      const addedRestaurants = updates.restaurants.filter(
        slug => !menu.restaurants.includes(slug)
      );

      await Promise.all([
        ...removedRestaurants.map(slug =>
          Restaurant.findOne({ slug }).then(r => r?.removeMenu(menu.slug))
        ),
        ...addedRestaurants.map(slug =>
          Restaurant.findOne({ slug }).then(r => r?.addMenu(menu.slug))
        )
      ]);
    }

    // Update menu
    Object.assign(menu, updates);
    await menu.save();

    const updatedMenu = await Menu.findById(menu._id)
      .populate('restaurants', 'name slug cuisineType')
      .populate({
        path: 'dishes',
        match: { status: 'active' },
        select: 'name slug price isSignatureDish'
      })
      .lean();

    successResponse(res, updatedMenu, {
      message: 'Menu updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', error, 400);
    }
    errorResponse(res, `Failed to update menu: ${slug}`, error);
  }
};

const deleteMenu = async (req, res) => {
  const { slug } = req.params;
  const { hardDelete = false } = req.query;

  try {
    const menu = await Menu.findOne({ slug });
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: 'Menu not found'
      });
    }

    if (hardDelete) {
      // Clean up references
      await Promise.all([
        ...menu.restaurants.map(restaurantSlug =>
          Restaurant.findOne({ slug: restaurantSlug }).then(r => r?.removeMenu(slug))
        ),
        Dish.updateMany(
          { menus: slug },
          { $pull: { menus: slug } }
        )
      ]);

      await menu.deleteOne();
    } else {
      // Soft delete
      menu.status = 'inactive';
      await menu.save();
    }

    successResponse(res, null, {
      message: `Menu ${hardDelete ? 'deleted' : 'deactivated'} successfully`
    });
  } catch (error) {
    errorResponse(res, `Failed to ${hardDelete ? 'delete' : 'deactivate'} menu: ${slug}`, error);
  }
};

const getMenusByRestaurant = async (req, res) => {
  const { slug: restaurantSlug } = req.params;
  const { category, status = 'active', includeDishes = true } = req.query;

  try {
    const restaurant = await Restaurant.findOne({ slug: restaurantSlug });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const menus = await Menu.findByRestaurant(restaurantSlug, {
      category,
      status,
      includeDishes
    });

    successResponse(res, menus, {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug
      }
    });
  } catch (error) {
    errorResponse(res, 'Error fetching restaurant menus', error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllMenus,
  getMenuBySlug,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenusByRestaurant
};