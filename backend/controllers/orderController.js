const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper function to handle async route handlers
const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Get all orders (admin only)
exports.getAllOrders = handleAsync(async (req, res) => {
  const orders = await Order.find()
    .populate('user', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: orders
  });
});

// Get orders by user ID
exports.getOrdersByUser = handleAsync(async (req, res) => {
  const userId = req.params.userId || req.user.id;
  const orders = await Order.find({ user: userId })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: orders
  });
});

// Create new order
exports.createOrder = handleAsync(async (req, res) => {
  const {
    deliveryAddress,
    paymentMethod,
    deliveryInstructions
  } = req.body;

  // Validate required fields
  if (!deliveryAddress || !paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Delivery address and payment method are required'
    });
  }

  // Get user's cart
  const cart = await Cart.findByUser(req.user.id);
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Cart is empty'
    });
  }

  // Check delivery availability
  const unavailableItems = await cart.checkDeliveryAvailability();
  if (unavailableItems.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Some items are not available for delivery',
      data: { unavailableItems }
    });
  }

  // Create order from cart
  const order = await Order.create({
    user: req.user.id,
    items: cart.items,
    totalPrice: cart.totalPrice,
    deliveryAddress,
    paymentMethod,
    deliveryInstructions,
    restaurant: cart.items[0].product.restaurant // Assuming all items are from same restaurant
  });

  // Clear cart after successful order creation
  await cart.clearCart();

  res.status(201).json({
    success: true,
    data: order
  });
});

// Get all orders for current user
exports.getOrders = handleAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user.id })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: orders
  });
});

// Get single order by ID
exports.getOrderById = handleAsync(async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .populate('user', 'name email')
    .populate('restaurant', 'name address');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user is authorized to view this order
  if (!req.user.isAdmin && order.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this order'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// Update order status
exports.updateOrderStatus = handleAsync(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Only restaurant staff or admin can update order status
  if (!req.user.isRestaurantStaff && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update order status'
    });
  }

  // Validate status transition
  const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order status'
    });
  }

  try {
    await order.updateStatus(status);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Cannot update order status'
    });
  }
});

// Cancel order
exports.cancelOrder = handleAsync(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.orderId);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found'
    });
  }

  // Check if user is authorized to cancel this order
  if (!req.user.isAdmin && order.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to cancel this order'
    });
  }

  try {
    await order.cancelOrder(reason);
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || 'Cannot cancel order in current status'
    });
  }
});

