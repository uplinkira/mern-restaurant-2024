// backend/controllers/productController.js
const Product = require('../models/Product');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// Pagination middleware with default limit of 8
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 8, 100);
  req.pagination = { skip: (page - 1) * limit, limit, page };
  next();
};

// Response utilities
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ 
    success: false, 
    message, 
    error: error?.message || 'An error occurred' 
  });
};

// GET all products with enhanced filtering
const getAllProducts = async (req, res) => {
  const { 
    search = '', 
    category = '',
    sortBy = 'createdAt',
    order = 'desc',
    availability = 'all',
    featured = 'false'
  } = req.query;
  const { skip, limit, page } = req.pagination;

  try {
    const query = {};

    // Search filter
    if (search.trim()) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ name: regex }, { description: regex }, { category: regex }];
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Availability filter
    if (availability === 'delivery') {
      query.availableForDelivery = true;
    }

    // Featured products filter
    if (featured === 'true') {
      query.isFeatured = true;
    }

    // Sort configuration
    const sortOptions = {};
    if (sortBy === 'price') {
      sortOptions.price = order === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .select('name description category price imageUrls slug isFeatured availableForDelivery caution')
        .lean(),
      Product.countDocuments(query)
    ]);

    successResponse(res, products, { 
      total, 
      page, 
      limit,
      totalPages: Math.ceil(total / limit),
      currentCategory: category || 'All',
      currentSort: { field: sortBy, order }
    });
  } catch (error) {
    errorResponse(res, 'Error fetching products', error);
  }
};

// GET single product with optimized query
const getProductBySlug = async (req, res) => {
  const { slug } = req.params;
  const { includeRelated = 'true' } = req.query;

  try {
    const query = Product.findOne({ slug })
      .select('name description category price imageUrls slug isFeatured availableForDelivery ingredients allergens caution');

    if (includeRelated === 'true') {
      query
        .populate('relatedDishes', 'name slug ingredients allergens price isSignatureDish')
        .populate('relatedRestaurants', 'name slug cuisineType');
    }

    const product = await query.lean();

    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    // Get related products
    let relatedProducts = [];
    if (includeRelated === 'true') {
      relatedProducts = await Product.find({
        category: product.category,
        slug: { $ne: product.slug }
      })
      .select('name slug price isFeatured')
      .limit(4)
      .lean();
    }

    successResponse(res, { ...product, relatedProducts });
  } catch (error) {
    errorResponse(res, 'Error fetching product', error);
  }
};

// Optimized related entities validation
const validateRelatedEntities = async (dishSlugs = [], restaurantSlugs = []) => {
  if (!dishSlugs.length && !restaurantSlugs.length) {
    return { dishes: [], restaurants: [] };
  }

  const [dishes, restaurants] = await Promise.all([
    dishSlugs.length ? Dish.find({ slug: { $in: dishSlugs } }).select('slug').lean() : [],
    restaurantSlugs.length ? Restaurant.find({ slug: { $in: restaurantSlugs } }).select('slug').lean() : []
  ]);

  if (dishSlugs.length && dishes.length !== dishSlugs.length) {
    throw new Error('Some related dishes not found');
  }

  if (restaurantSlugs.length && restaurants.length !== restaurantSlugs.length) {
    throw new Error('Some related restaurants not found');
  }

  return {
    dishes: dishes.map(dish => dish.slug),
    restaurants: restaurants.map(restaurant => restaurant.slug)
  };
};

// Rest of the controller methods remain the same but with lean() optimization
const createProduct = async (req, res) => {
  const {
    name, description, category, ingredients, allergens,
    price, isFeatured, availableForDelivery, caution,
    slug, imageUrls,
  } = req.body;

  try {
    const product = new Product({
      name, description, category, ingredients,
      allergens, price, isFeatured, availableForDelivery,
      caution, slug, imageUrls,
    });

    await product.save();
    successResponse(res, product.toObject(), { message: 'Product created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating product', error);
  }
};

const updateProduct = async (req, res) => {
  const { slug } = req.params;
  const updateData = { ...req.body };
  delete updateData.slug; // Prevent slug modification

  try {
    if (updateData.relatedDishes || updateData.relatedRestaurants) {
      const { dishes, restaurants } = await validateRelatedEntities(
        updateData.relatedDishes || [],
        updateData.relatedRestaurants || []
      );
      updateData.relatedDishes = dishes;
      updateData.relatedRestaurants = restaurants;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { slug },
      updateData,
      { new: true }
    )
    .select('name description category price imageUrls slug isFeatured availableForDelivery ingredients allergens caution')
    .lean();

    if (!updatedProduct) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    successResponse(res, updatedProduct, { message: 'Product updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating product', error);
  }
};

const deleteProduct = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOneAndDelete({ slug }).lean();
    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }
    successResponse(res, product, { message: 'Product deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Error deleting product', error);
  }
};

// Optimized search with lean()
const searchProducts = async (req, res) => {
  const { q } = req.query;
  const { skip, limit, page } = req.pagination;

  try {
    if (!q?.trim()) {
      return errorResponse(res, 'Search query is required', null, 400);
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [products, total] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('name description category price imageUrls slug isFeatured')
        .lean(),
      Product.countDocuments({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
    ]);

    if (!products.length) {
      return errorResponse(res, 'No products found matching your search', null, 404);
    }

    successResponse(res, products, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error searching products', error);
  }
};

module.exports = {
  applyPagination: paginate,
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
};