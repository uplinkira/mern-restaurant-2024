const Product = require('../models/Product');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// Middleware for pagination
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Limit results to a maximum of 100
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

// **GET all products with optional pagination and search**
const getAllProducts = async (req, res) => {
  const { search = '', category } = req.query;
  const { skip, limit, page } = req.pagination;

  try {
    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); // Escape special characters
      query.$or = [{ name: regex }, { description: regex }, { category: regex }];
    }

    if (category) query.category = category;

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('relatedDishes', 'name slug')
        .populate('relatedRestaurants', 'name slug'),
      Product.countDocuments(query),
    ]);

    successResponse(res, products, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching products', error);
  }
};

// **GET a single product by slug**
const getProductBySlug = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOne({ slug })
      .populate('relatedDishes', 'name description ingredients')
      .populate('relatedRestaurants', 'name address');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    successResponse(res, product);
  } catch (error) {
    errorResponse(res, 'Error fetching product by slug', error);
  }
};

// Helper function to validate related entities
const validateRelatedEntities = async (dishSlugs, restaurantSlugs) => {
  const [dishes, restaurants] = await Promise.all([
    Dish.find({ slug: { $in: dishSlugs } }),
    Restaurant.find({ slug: { $in: restaurantSlugs } }),
  ]);

  if (dishes.length !== dishSlugs.length) {
    throw new Error('Some related dishes not found');
  }

  if (restaurants.length !== restaurantSlugs.length) {
    throw new Error('Some related restaurants not found');
  }

  return { dishes, restaurants };
};

// **POST create a new product**
const createProduct = async (req, res) => {
  const {
    name,
    description,
    category,
    ingredients,
    allergens,
    price,
    isFeatured,
    availableForDelivery,
    caution,
    relatedDishes = [],
    relatedRestaurants = [],
    slug,
    imageUrls,
  } = req.body;

  try {
    const { dishes, restaurants } = await validateRelatedEntities(relatedDishes, relatedRestaurants);

    const product = new Product({
      name,
      description,
      category,
      ingredients,
      allergens,
      price,
      isFeatured,
      availableForDelivery,
      caution,
      relatedDishes: dishes.map((dish) => dish.slug),
      relatedRestaurants: restaurants.map((restaurant) => restaurant.slug),
      slug,
      imageUrls,
    });

    await product.save();
    successResponse(res, product, { message: 'Product created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating product', error);
  }
};

// **PUT update a product by slug**
const updateProduct = async (req, res) => {
  const { slug } = req.params;
  const {
    name,
    description,
    category,
    ingredients,
    allergens,
    price,
    isFeatured,
    availableForDelivery,
    caution,
    relatedDishes = [],
    relatedRestaurants = [],
    imageUrls,
  } = req.body;

  try {
    const { dishes, restaurants } = await validateRelatedEntities(relatedDishes, relatedRestaurants);

    const updatedProduct = await Product.findOneAndUpdate(
      { slug },
      {
        name,
        description,
        category,
        ingredients,
        allergens,
        price,
        isFeatured,
        availableForDelivery,
        caution,
        relatedDishes: dishes.map((dish) => dish.slug),
        relatedRestaurants: restaurants.map((restaurant) => restaurant.slug),
        imageUrls,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    successResponse(res, updatedProduct, { message: 'Product updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating product', error);
  }
};

// **DELETE a product by slug**
const deleteProduct = async (req, res) => {
  const { slug } = req.params;

  try {
    const product = await Product.findOneAndDelete({ slug });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    successResponse(res, product, { message: 'Product deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Error deleting product', error);
  }
};

// **Search products by name, description, or category**
const searchProducts = async (req, res) => {
  const { q } = req.query;
  const { skip, limit, page } = req.pagination;

  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const [products, total] = await Promise.all([
      Product.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      })
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Product.countDocuments({
        $or: [{ name: regex }, { description: regex }, { category: regex }],
      }),
    ]);

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'No products found matching your search' });
    }

    successResponse(res, products, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error searching products', error);
  }
};

// Middleware exports
const applyPagination = paginate;

module.exports = {
  applyPagination,
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
};
