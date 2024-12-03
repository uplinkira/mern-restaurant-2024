// backend/controllers/menuController.js
const Menu = require('../models/Menu');
const Restaurant = require('../models/Restaurant');

// Middleware for pagination
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Limit to a maximum of 100 items
  req.pagination = { skip: (page - 1) * limit, limit, page };
  next();
};

// Utility for standardized responses
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ success: false, message, error: error?.message || 'An error occurred' });
};

// **GET all menus with pagination and search**
const getAllMenus = async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const search = req.query.search || '';

  try {
    const query = search
      ? { $or: [{ name: new RegExp(search, 'i') }, { description: new RegExp(search, 'i') }] }
      : {};

    const [menus, total] = await Promise.all([
      Menu.find(query)
        .populate('restaurants', 'name address')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Menu.countDocuments(query),
    ]);

    successResponse(res, menus, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching menus', error);
  }
};

// **GET a single menu by slug**
const getMenuBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const menu = await Menu.findOne({ slug }).populate('restaurants', 'name address');
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }
    successResponse(res, menu);
  } catch (error) {
    errorResponse(res, 'Error fetching menu by slug', error);
  }
};

// **Create a new menu**
const createMenu = async (req, res) => {
  const { name, description, restaurants = [], slug } = req.body;

  try {
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurants } });

    if (restaurantDocs.length !== restaurants.length) {
      return res.status(400).json({ success: false, message: 'Some restaurants not found' });
    }

    const menu = new Menu({
      name,
      description,
      restaurants: restaurantDocs.map((restaurant) => restaurant.slug),
      slug,
    });

    await menu.save();
    successResponse(res, menu, { message: 'Menu created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating menu', error);
  }
};

// **Update a menu by slug**
const updateMenu = async (req, res) => {
  const { slug } = req.params;
  const { name, description, restaurants = [] } = req.body;

  try {
    const restaurantDocs = await Restaurant.find({ slug: { $in: restaurants } });

    if (restaurantDocs.length !== restaurants.length) {
      return res.status(400).json({ success: false, message: 'Some restaurants not found' });
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        restaurants: restaurantDocs.map((restaurant) => restaurant.slug),
      },
      { new: true }
    ).populate('restaurants', 'name address');

    if (!updatedMenu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    successResponse(res, updatedMenu, { message: 'Menu updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating menu', error);
  }
};

// **Delete a menu by slug**
const deleteMenu = async (req, res) => {
  const { slug } = req.params;

  try {
    const menu = await Menu.findOneAndDelete({ slug });
    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }
    successResponse(res, menu, { message: 'Menu deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Error deleting menu', error);
  }
};

// **GET menus by restaurant slug**
const getMenusByRestaurantSlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const menus = await Menu.find({ restaurants: slug }).populate('restaurants', 'name address');
    if (!menus.length) {
      return res.status(404).json({ success: false, message: 'No menus found for this restaurant' });
    }
    successResponse(res, menus);
  } catch (error) {
    errorResponse(res, 'Error fetching menus for restaurant', error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllMenus,
  getMenuBySlug,
  createMenu,
  updateMenu,
  deleteMenu,
  getMenusByRestaurantSlug,
};
