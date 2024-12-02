// backend/controllers/restaurantController.js
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Menu = require('../models/Menu');

// Utility for pagination middleware
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Limit to 100 results max
  req.pagination = { skip: (page - 1) * limit, limit, page };
  next();
};

// Utility for standard success responses
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

// Utility for error handling responses
const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ success: false, message, error: error?.message || 'An error occurred' });
};

// **GET all restaurants with optional search and pagination**
const getAllRestaurants = async (req, res) => {
  const { skip, limit, page } = req.pagination;
  const search = req.query.search || '';

  try {
    const query = search
      ? {
          $or: [
            { name: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { cuisineType: new RegExp(search, 'i') },
          ],
        }
      : {};

    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('menus', 'name')
        .populate('dishes', 'name'),
      Restaurant.countDocuments(query),
    ]);

    successResponse(res, restaurants, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching restaurants', error);
  }
};

// **GET a restaurant by slug with related details**
const getRestaurantBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const restaurant = await Restaurant.findOne({ slug })
      .populate('menus', 'name description')
      .populate('dishes', 'name description price');

    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    successResponse(res, restaurant);
  } catch (error) {
    errorResponse(res, 'Error fetching restaurant details', error);
  }
};

// **GET dishes associated with a restaurant**
const getDishesByRestaurant = async (req, res) => {
  const { slug } = req.params;

  try {
    const restaurant = await Restaurant.findOne({ slug }).select('dishes');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const dishes = await Dish.find({ slug: { $in: restaurant.dishes } });
    successResponse(res, dishes);
  } catch (error) {
    errorResponse(res, 'Error fetching dishes for restaurant', error);
  }
};

// **GET menus associated with a restaurant**
const getMenusByRestaurant = async (req, res) => {
  const { slug } = req.params;

  try {
    const restaurant = await Restaurant.findOne({ slug }).select('menus');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menus = await Menu.find({ slug: { $in: restaurant.menus } });
    successResponse(res, menus);
  } catch (error) {
    errorResponse(res, 'Error fetching menus for restaurant', error);
  }
};

// **POST create a new restaurant**
const createRestaurant = async (req, res) => {
  const {
    name,
    description,
    cuisineType,
    address,
    phone,
    email,
    website,
    openingHours,
    specialties,
    isVRExperience,
    maxCapacity,
    priceRange,
    slug,
  } = req.body;

  try {
    const restaurant = new Restaurant({
      name,
      description,
      cuisineType,
      address,
      phone,
      email,
      website,
      openingHours,
      specialties,
      isVRExperience,
      maxCapacity,
      priceRange,
      slug,
    });

    await restaurant.save();
    successResponse(res, restaurant, { message: 'Restaurant created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating restaurant', error);
  }
};

// **PUT update a restaurant by slug**
const updateRestaurant = async (req, res) => {
  const { slug } = req.params;
  const {
    name,
    description,
    cuisineType,
    address,
    phone,
    email,
    website,
    openingHours,
    specialties,
    isVRExperience,
    maxCapacity,
    priceRange,
  } = req.body;

  try {
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        cuisineType,
        address,
        phone,
        email,
        website,
        openingHours,
        specialties,
        isVRExperience,
        maxCapacity,
        priceRange,
      },
      { new: true }
    );

    if (!updatedRestaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    successResponse(res, updatedRestaurant, { message: 'Restaurant updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating restaurant', error);
  }
};

// **DELETE a restaurant by slug**
const deleteRestaurant = async (req, res) => {
  const { slug } = req.params;

  try {
    const restaurant = await Restaurant.findOneAndDelete({ slug });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    successResponse(res, restaurant, { message: 'Restaurant deleted successfully' });
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
