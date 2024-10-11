const Product = require('../models/Product');

// Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product', error });
  }
};

// Search products by name or description
const searchProducts = async (req, res) => {
  const { q } = req.query;
  try {
    if (!q || q.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    const regex = new RegExp(q, 'i');
    const products = await Product.find({ $or: [{ name: regex }, { description: regex }] });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error during product search', error });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts
};
