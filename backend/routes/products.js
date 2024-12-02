// backend/routes/products.js
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Dish = require('../models/Dish'); // Import Dish model for related products
const Restaurant = require('../models/Restaurant'); // Import Restaurant model for related products

// **GET all products with optional pagination and search**
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category } = req.query;
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
      query.category = category; // Filter by category if provided
    }

    // Use indexes for fast querying
    const products = await Product.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .select('name description category price imageUrls') // Minimize data
      .populate('relatedDishes', 'name slug') // Only populate necessary fields
      .populate('relatedRestaurants', 'name slug');

    const total = await Product.countDocuments(query);

    res.status(200).json({
      success: true,
      data: products,
      meta: { total, page, limit }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// **GET a single product by slug**
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await Product.findOne({ slug })
      .populate('relatedDishes', 'name slug ingredients allergens')
      .populate('relatedRestaurants', 'name slug');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// **Helper function to validate related dishes and restaurants**
async function validateRelatedEntities(dishSlugs, restaurantSlugs) {
  const [dishDocs, restaurantDocs] = await Promise.all([
    Dish.find({ slug: { $in: dishSlugs } }),
    Restaurant.find({ slug: { $in: restaurantSlugs } }),
  ]);

  if (dishDocs.length !== dishSlugs.length) {
    throw new Error('Some related dishes not found');
  }

  if (restaurantDocs.length !== restaurantSlugs.length) {
    throw new Error('Some related restaurants not found');
  }

  return {
    dishes: dishDocs.map(dish => dish.slug),
    restaurants: restaurantDocs.map(restaurant => restaurant.slug),
  };
}

// **POST create a new product**
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
    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: error.message || 'Failed to create product' });
  }
});

// **PUT update a product by slug**
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
    ).populate('relatedDishes', 'name slug').populate('relatedRestaurants', 'name slug');

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product updated successfully', updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: error.message || 'Failed to update product' });
  }
});

// **DELETE a product by slug**
router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await Product.findOneAndDelete({ slug });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Failed to delete product' });
  }
});

module.exports = router;
