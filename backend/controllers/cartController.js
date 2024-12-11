// backend/controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Helper function to handle async route handlers
const handleAsync = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get user's cart
exports.getCart = handleAsync(async (req, res) => {
  console.log('Getting cart for user:', req.userId);
  
  const cart = await Cart.findByUser(req.userId);
  
  // Populate product details
  await cart.populate({
    path: 'items.product',
    select: 'name slug price stockStatus availableForDelivery category allergens'
  });

  console.log('Cart found:', {
    itemCount: cart.items.length,
    total: cart.totalPrice
  });

  res.status(200).json({
    success: true,
    data: cart
  });
});

// Add item to cart
exports.addToCart = handleAsync(async (req, res) => {
  const { product, quantity = 1 } = req.body;
  console.log('Adding to cart:', { product, quantity, userId: req.userId });

  // Extract product ID
  const productId = typeof product === 'string' ? product : product._id || product.id;
  if (!productId) {
    throw new Error('Invalid product data: Missing product ID');
  }

  // Get or create cart
  const cart = await Cart.findByUser(req.userId);
  
  // Add product
  await cart.addProduct(productId, quantity);
  console.log('Product added successfully:', {
    productId,
    quantity,
    cartItemCount: cart.items.length
  });

  res.status(200).json({
    success: true,
    data: cart
  });
});

// Update cart item
exports.updateCartItem = handleAsync(async (req, res) => {
  const { productId, quantity } = req.body;
  console.log('Updating cart item:', {
    productId,
    quantity,
    userId: req.userId,
    method: req.method,
    path: req.path
  });

  // Validate input
  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  if (quantity === undefined || quantity < 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid quantity is required'
    });
  }

  try {
    // Get cart and populate product details
    const cart = await Cart.findByUser(req.userId);
    
    // Update quantity
    const updatedCart = await cart.updateProductQuantity(productId, quantity);

    console.log('Cart item updated:', {
      productId,
      newQuantity: quantity,
      cartItemCount: updatedCart.items.length,
      items: updatedCart.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.price
      }))
    });

    res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update cart item'
    });
  }
});

// Remove item from cart
exports.removeFromCart = handleAsync(async (req, res) => {
  // Get productId from query params, body, or route params
  const productId = req.query.productId || req.body.productId || req.params.productId;
  console.log('Removing from cart:', { 
    productId, 
    userId: req.userId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    params: req.params
  });

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'Product ID is required'
    });
  }

  try {
    // Get cart and populate product details
    const cart = await Cart.findByUser(req.userId);
    
    // Remove product
    const updatedCart = await cart.removeProduct(productId);

    console.log('Product removed:', {
      productId,
      cartItemCount: updatedCart.items.length,
      items: updatedCart.items.map(item => ({
        productId: item.product._id,
        quantity: item.quantity,
        price: item.price
      }))
    });

    res.status(200).json({
      success: true,
      data: updatedCart
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove item from cart'
    });
  }
});

// Clear cart
exports.clearCart = handleAsync(async (req, res) => {
  console.log('Clearing cart for user:', req.userId);

  const cart = await Cart.findByUser(req.userId);
  await cart.clearCart();
  console.log('Cart cleared successfully');

  res.status(200).json({
    success: true,
    data: {
      items: [],
      totalPrice: 0
    }
  });
});

// Check delivery availability
exports.checkDeliveryAvailability = handleAsync(async (req, res) => {
  console.log('Checking delivery availability for user:', req.userId);

  const cart = await Cart.findByUser(req.userId);
  const availability = await cart.checkDeliveryAvailability();
  console.log('Delivery availability checked:', availability);

  res.status(200).json({
    success: true,
    data: availability
  });
});