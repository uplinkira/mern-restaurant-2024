const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/authMiddleware');

// Fetch user cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Fetch cart for the authenticated user, populating product details
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for this user' });
    }

    res.json(cart);
  } catch (error) {
    console.error('Error fetching user cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add product to cart
router.post('/add', authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;

  try {
    // Ensure the product exists before adding it to the cart
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Find the user's cart, or create a new one if it doesn't exist
    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [], totalPrice: 0 });
    }

    // Check if the product already exists in the cart
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      // If the product exists, update the quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // If the product does not exist, add it to the cart
      cart.items.push({ product: productId, quantity });
    }

    // Update the total price
    cart.totalPrice += product.price * quantity;

    // Save the updated cart
    await cart.save();

    res.json(cart);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
