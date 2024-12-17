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
  try {
    const userId = req.params.userId || req.userId;
    let query = { user: userId };
    
    // 添加状态过滤并记录日志
    if (req.query.status) {
      query.status = req.query.status;
      console.log('Filtering orders by status:', {
        requestedStatus: req.query.status,
        query
      });
    }

    const orders = await Order.find(query)
      .populate({
        path: 'items.product',
        select: 'name slug price'
      })
      .sort('-createdAt');

    console.log('Found orders:', {
      total: orders.length,
      statusCounts: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {})
    });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Create new order
exports.createOrder = handleAsync(async (req, res) => {
  try {
    console.log('Creating order with data:', {
      userId: req.userId,
      body: JSON.stringify(req.body, null, 2)
    });

    const {
      deliveryAddress,
      paymentMethod,
      deliveryInstructions
    } = req.body;

    // Log received data
    console.log('Received order data:', {
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      userId: req.userId
    });

    // Validate required fields
    if (!deliveryAddress) {
      console.log('Validation failed: Missing delivery address');
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required'
      });
    }

    if (!paymentMethod) {
      console.log('Validation failed: Missing payment method');
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Validate delivery address fields
    const requiredAddressFields = ['street', 'city', 'state', 'zipCode', 'country'];
    const missingFields = requiredAddressFields.filter(field => !deliveryAddress[field]);
    if (missingFields.length > 0) {
      console.log('Validation failed: Missing address fields:', missingFields);
      return res.status(400).json({
        success: false,
        message: `Missing required address fields: ${missingFields.join(', ')}`,
        details: {
          missingFields,
          receivedFields: Object.keys(deliveryAddress)
        }
      });
    }

    // Get user's cart
    console.log('Fetching cart for user:', req.userId);
    const cart = await Cart.findByUser(req.userId);
    if (!cart || cart.items.length === 0) {
      console.log('Validation failed: Empty cart');
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    console.log('Cart found:', {
      cartId: cart._id,
      itemCount: cart.items.length,
      items: cart.items.map(item => ({
        productId: item.product,
        quantity: item.quantity,
        price: item.price
      }))
    });

    // Create order from cart
    const orderData = {
      user: req.userId,
      items: cart.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: cart.totalPrice,
      deliveryAddress,
      paymentMethod,
      deliveryInstructions,
      status: 'pending'
    };

    console.log('Creating order with data:', orderData);
    const order = await Order.create(orderData);

    // Populate the order with product details
    await order.populate({
      path: 'items.product',
      select: 'name slug price'
    });

    console.log('Order created successfully:', {
      orderId: order._id,
      userId: req.userId,
      items: order.items.length,
      status: order.status
    });

    // Clear cart after successful order creation
    await cart.clearCart();

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', {
      error: error.message,
      stack: error.stack,
      userId: req.userId,
      body: req.body
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order',
      details: {
        error: error.message,
        type: error.name,
        code: error.code
      }
    });
  }
});

// Get all orders for current user
exports.getOrders = handleAsync(async (req, res) => {
  const orders = await Order.find({ user: req.userId })
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
  if (!req.user.isAdmin && order.user.toString() !== req.userId) {
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
  try {
    console.log('Cancelling order:', {
      orderId: req.params.orderId,
      userId: req.userId,
      reason: req.body.reason
    });

    const { reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      console.log('Order not found:', req.params.orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is authorized to cancel this order
    if (!req.user?.isAdmin && order.user.toString() !== req.userId) {
      console.log('Unauthorized cancel attempt:', {
        orderId: req.params.orderId,
        orderUserId: order.user,
        requestUserId: req.userId
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }

    // Check if order can be cancelled
    if (order.status !== 'pending') {
      console.log('Cannot cancel order in current status:', {
        orderId: req.params.orderId,
        currentStatus: order.status
      });
      return res.status(400).json({
        success: false,
        message: 'Order can only be cancelled when in pending status'
      });
    }

    // Update order status to cancelled
    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    // Populate order details
    await order.populate({
      path: 'items.product',
      select: 'name slug price'
    });

    console.log('Order cancelled successfully:', {
      orderId: order._id,
      status: order.status,
      reason: reason
    });

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', {
      error: error.message,
      stack: error.stack,
      orderId: req.params.orderId,
      userId: req.userId
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Cannot cancel order',
      details: {
        error: error.message,
        type: error.name,
        code: error.code
      }
    });
  }
});

