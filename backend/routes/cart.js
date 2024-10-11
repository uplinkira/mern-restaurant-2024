
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product'); // Adjust for product schema
const authMiddleware = require('../middleware/authMiddleware');

// Fetch user cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user }).populate('items.product');
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add product to cart
router.post('/add', authMiddleware, async (req, res) => {
  const { productId, quantity } = req.body;
  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let cart = await Cart.findOne({ user: req.user });
    if (!cart) {
      cart = new Cart({ user: req.user, items: [], totalPrice: 0 });
    }

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }
    
    cart.totalPrice += product.price * quantity;
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;