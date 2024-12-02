// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authMiddleware } = require('../middleware/authMiddleware');

// **GET the authenticated user's cart**
router.get('/', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product', 'name slug price imageUrls');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for this user' });
    }
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error fetching user cart:', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// **POST add a product to the cart**
router.post('/add', authMiddleware, async (req, res) => {
  const { productSlug, quantity } = req.body;

  try {
    const product = await Product.findOne({ slug: productSlug }).select('name price imageUrls');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      cart = new Cart({ user: req.userId, items: [], totalPrice: 0 });
    }

    await cart.addProduct(productSlug, quantity);
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ message: 'Failed to add product to cart' });
  }
});

// **PUT update the quantity of a product in the cart**
router.put('/update', authMiddleware, async (req, res) => {
  const { productSlug, quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.updateProductQuantity(productSlug, quantity);
    res.status(200).json(cart);
  } catch (error) {
    console.error('Error updating product quantity in cart:', error);
    res.status(500).json({ message: 'Failed to update product quantity in cart' });
  }
});

// **DELETE remove a product from the cart**
router.delete('/remove/:productSlug', authMiddleware, async (req, res) => {
  const { productSlug } = req.params;

  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.removeProduct(productSlug);
    res.status(200).json({ message: 'Product removed from cart', cart });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ message: 'Failed to remove product from cart' });
  }
});

// **DELETE clear the cart**
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    await cart.clearCart();
    res.status(200).json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart' });
  }
});

// **GET check delivery availability for products in the cart**
router.get('/check-delivery', authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product', 'name slug availableForDelivery');
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const unavailableItems = cart.items.filter(item => !item.product.availableForDelivery);
    if (unavailableItems.length > 0) {
      return res.status(200).json({
        message: 'Some items are unavailable for delivery',
        unavailableItems,
      });
    }

    res.status(200).json({ message: 'All items are available for delivery' });
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    res.status(500).json({ message: 'Failed to check delivery availability' });
  }
});

module.exports = router;
