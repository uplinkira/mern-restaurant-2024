// backend/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');

// Utility for standardized responses
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error('Error:', message, error);
  res.status(statusCode).json({ 
    success: false, 
    message,
    error: error?.message || 'An error occurred'
  });
};

// GET all products with optional pagination and search
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;
    
    const skip = (page - 1) * limit;
    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { category: new RegExp(search, 'i') },
      ];
    }

    if (category) {
      query.category = category;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
        .select('name description category price imageUrls slug isFeatured availableForDelivery')
        .populate('relatedDishes', 'name slug')
        .populate('relatedRestaurants', 'name slug'),
      Product.countDocuments(query)
    ]);

    successResponse(res, products, { 
      total, 
      page: Number(page), 
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    errorResponse(res, 'Failed to fetch products', error);
  }
});

// GET a single product by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  const { includeRelated = 'true' } = req.query;

  try {
    const query = Product.findOne({ slug });

    if (includeRelated === 'true') {
      query
        .populate('relatedDishes', 'name slug ingredients allergens price isSignatureDish')
        .populate('relatedRestaurants', 'name slug cuisineType');
    }

    const product = await query.exec();

    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    // Get related products based on category
    let relatedProducts = [];
    if (includeRelated === 'true') {
      relatedProducts = await Product.find({
        category: product.category,
        slug: { $ne: product.slug }
      })
      .select('name slug price isFeatured')
      .limit(4);
    }

    successResponse(res, {
      ...product.toObject(),
      relatedProducts
    });
  } catch (error) {
    errorResponse(res, 'Failed to fetch product', error);
  }
});

// Helper function to validate related entities
async function validateRelatedEntities(dishSlugs = [], restaurantSlugs = []) {
  if (!dishSlugs.length && !restaurantSlugs.length) {
    return { dishes: [], restaurants: [] };
  }

  const [dishDocs, restaurantDocs] = await Promise.all([
    dishSlugs.length ? Dish.find({ slug: { $in: dishSlugs } }) : [],
    restaurantSlugs.length ? Restaurant.find({ slug: { $in: restaurantSlugs } }) : []
  ]);

  if (dishSlugs.length && dishDocs.length !== dishSlugs.length) {
    throw new Error('Some related dishes not found');
  }

  if (restaurantSlugs.length && restaurantDocs.length !== restaurantSlugs.length) {
    throw new Error('Some related restaurants not found');
  }

  return {
    dishes: dishDocs.map(dish => dish.slug),
    restaurants: restaurantDocs.map(restaurant => restaurant.slug),
  };
}

// POST create a new product
router.post('/', async (req, res) => {
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
      relatedDishes: dishes,
      relatedRestaurants: restaurants,
      slug,
      imageUrls,
    });

    await product.save();
    successResponse(res, product, { message: 'Product created successfully' });
  } catch (error) {
    errorResponse(res, 'Failed to create product', error);
  }
});

// PUT update a product by slug
router.put('/:slug', async (req, res) => {
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
        relatedDishes: dishes,
        relatedRestaurants: restaurants,
        imageUrls,
      },
      { new: true }
    ).populate('relatedDishes', 'name slug')
     .populate('relatedRestaurants', 'name slug');

    if (!updatedProduct) {
      return errorResponse(res, 'Product not found', null, 404);
    }

    successResponse(res, updatedProduct, { message: 'Product updated successfully' });
  } catch (error) {
    errorResponse(res, 'Failed to update product', error);
  }
});

// DELETE a product by slug
router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await Product.findOneAndDelete({ slug });
    if (!product) {
      return errorResponse(res, 'Product not found', null, 404);
    }
    successResponse(res, product, { message: 'Product deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Failed to delete product', error);
  }
});

module.exports = router;
