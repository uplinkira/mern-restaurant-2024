// backend/controllers/restaurantController.js
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Menu = require('../models/Menu');

// Enhanced pagination middleware
const paginate = (req, res, next) => {
 const page = Math.max(1, parseInt(req.query.page) || 1);
 const limit = Math.min(parseInt(req.query.limit) || 12, 100);
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

// Success response utility
const successResponse = (res, data, meta = {}) => {
 res.status(200).json({
   success: true, 
   data,
   meta: {
     ...meta,
     timestamp: new Date().toISOString()
   }
 });
};

// Error response utility
const errorResponse = (res, message, error, statusCode = 500) => {
 console.error(`[Restaurants] ${message}:`, error);
 res.status(statusCode).json({
   success: false,
   message,
   error: error?.message || 'An error occurred',
   timestamp: new Date().toISOString()
 });
};

// GET all restaurants
const getAllRestaurants = async (req, res) => {
 const { skip, limit, page, sort } = req.pagination;
 const { search = '', status, cuisineType, priceRange, isVRExperience } = req.query;

 try {
   // Build query
   const query = {};
   
   if (status) {
     query.status = status;
   }

   if (search) {
     query.$or = [
       { name: new RegExp(search, 'i') },
       { description: new RegExp(search, 'i') },
       { cuisineType: new RegExp(search, 'i') },
     ];
   }

   if (cuisineType) query.cuisineType = cuisineType;
   if (priceRange) query.priceRange = priceRange;
   if (typeof isVRExperience === 'boolean') query.isVRExperience = isVRExperience;

   const [restaurants, total] = await Promise.all([
     Restaurant.find(query)
       .select('name description cuisineType priceRange images slug isVRExperience status')
       .skip(skip)
       .limit(limit)
       .sort(sort)
       .lean(),
     Restaurant.countDocuments(query)
   ]);

   // Handle pagination edge case
   if (restaurants.length === 0 && page > 1) {
     return res.status(404).json({
       success: false,
       message: 'No more restaurants found',
       meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit)
       }
     });
   }

   successResponse(res, restaurants, {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
     filters: {
       search,
       cuisineType,
       priceRange,
       isVRExperience
     }
   });
 } catch (error) {
   errorResponse(res, 'Failed to fetch restaurants', error);
 }
};

// GET restaurant by slug
const getRestaurantBySlug = async (req, res) => {
  const { slug } = req.params;
  const { 
    includeMenus = true, 
    includeDishes = true,
    menuStatus = 'active',
    dishStatus = 'active'
  } = req.query;

  try {
    const query = Restaurant.findOne({ slug });

    if (includeMenus) {
      // 深度填充菜单数据
      query.populate({
        path: 'menuList',
        match: { status: menuStatus },
        select: `
          name description category priceCategories 
          status slug type availableTimes requiresReservation
          minimumDiners maximumDiners
        `,
        options: { sort: { order: 1 } },
        // 嵌套填充菜品数据
        populate: includeDishes ? {
          path: 'dishes',
          match: { status: dishStatus },
          select: `
            name description price isSignatureDish 
            images status slug chenPiAge allergens 
            ingredients
          `,
          options: { 
            sort: { 
              isSignatureDish: -1, 
              chenPiAge: -1,
              name: 1 
            } 
          }
        } : null
      });
    }

    const restaurant = await query.lean();

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: `Restaurant with slug "${slug}" not found`,
        timestamp: new Date().toISOString()
      });
    }

    // 处理菜单分组
    if (restaurant.menuList?.length) {
      // 按类别组织菜单
      const menusByCategory = restaurant.menuList.reduce((acc, menu) => {
        if (!acc[menu.category]) {
          acc[menu.category] = [];
        }
        acc[menu.category].push(menu);
        return acc;
      }, {});

      // 添加分组信息到响应中
      restaurant.menuCategories = Object.keys(menusByCategory);
      restaurant.menusByCategory = menusByCategory;
    }

    successResponse(res, restaurant, {
      includesMenus: includeMenus,
      includesDishes: includeDishes,
      menuCount: restaurant.menuList?.length || 0,
      dishCount: restaurant.menuList?.reduce((count, menu) => 
        count + (menu.dishes?.length || 0), 0) || 0
    });

  } catch (error) {
    errorResponse(res, 'Failed to fetch restaurant details', error);
  }
};

// GET dishes by restaurant
const getDishesByRestaurant = async (req, res) => {
  const { slug } = req.params;
  const { 
    status = 'active',
    page = 1,
    limit = 12,
    sortBy = 'isSignatureDish',
    order = 'desc'
  } = req.query;

  try {
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const query = { 
      restaurants: slug,
      status 
    };

    const [dishes, total] = await Promise.all([
      Dish.find(query)
        .select(`
          name description price isSignatureDish 
          images status slug chenPiAge allergens 
          ingredients menus
        `)
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Dish.countDocuments(query)
    ]);

    successResponse(res, dishes, {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    errorResponse(res, 'Failed to fetch restaurant dishes', error);
  }
};

// GET menus by restaurant
const getMenusByRestaurant = async (req, res) => {
  const { slug } = req.params;
  const { status = 'active', category } = req.query;

  try {
    const restaurant = await Restaurant.findOne({ slug })
      .populate({
        path: 'menuList',
        match: { 
          status,
          ...(category && { category })
        },
        select: 'name description category priceCategories status slug'
      });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    successResponse(res, restaurant.menuList);
  } catch (error) {
    errorResponse(res, 'Failed to fetch restaurant menus', error);
  }
};

// Create restaurant (existing implementation)
const createRestaurant = async (req, res) => {
 const restaurantData = req.body;

 try {
   const restaurant = new Restaurant(restaurantData);
   await restaurant.save();
   successResponse(res, restaurant, { message: 'Restaurant created successfully' });
 } catch (error) {
   errorResponse(res, 'Failed to create restaurant', error);
 }
};

// Update restaurant (existing implementation)
const updateRestaurant = async (req, res) => {
 const { slug } = req.params;
 const updates = req.body;

 try {
   const restaurant = await Restaurant.findOneAndUpdate(
     { slug },
     updates,
     { new: true }
   );

   if (!restaurant) {
     return res.status(404).json({
       success: false,
       message: 'Restaurant not found'
     });
   }

   successResponse(res, restaurant, { message: 'Restaurant updated successfully' });
 } catch (error) {
   errorResponse(res, 'Failed to update restaurant', error);
 }
};

// Delete restaurant (existing implementation)
const deleteRestaurant = async (req, res) => {
 const { slug } = req.params;

 try {
   const restaurant = await Restaurant.findOneAndDelete({ slug });
   if (!restaurant) {
     return res.status(404).json({
       success: false,
       message: 'Restaurant not found'
     });
   }

   successResponse(res, null, { message: 'Restaurant deleted successfully' });
 } catch (error) {
   errorResponse(res, 'Failed to delete restaurant', error);
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
 deleteRestaurant
};