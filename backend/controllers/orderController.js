const Order = require('../models/Order');
const Product = require('../models/Product');

// Standardized response handlers
const successResponse = (res, data, meta = {}) => {
  res.status(200).json({ success: true, data, meta });
};

const errorResponse = (res, message, error, statusCode = 500) => {
  console.error(message, error);
  res.status(statusCode).json({ success: false, message, error: error?.message || 'An error occurred' });
};

// Middleware for pagination
const paginate = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(parseInt(req.query.limit) || 10, 100); // Limit results per page
  req.pagination = {
    skip: (page - 1) * limit,
    limit,
    page,
  };
  next();
};

// Get all orders with optional pagination
const getAllOrders = async (req, res) => {
  const { skip, limit, page } = req.pagination;

  try {
    const orders = await Order.find()
      .populate('user', 'username email') // Populate user details
      .populate('items.product', 'name price') // Populate product details
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments();
    successResponse(res, orders, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching orders', error);
  }
};

// Get a single order by ID
const getOrderById = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id)
      .populate('user', 'username email')
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    successResponse(res, order);
  } catch (error) {
    errorResponse(res, 'Error fetching order by ID', error);
  }
};

// Get orders for a specific user
const getOrdersByUser = async (req, res) => {
  const { userId } = req.params;
  const { skip, limit, page } = req.pagination;

  try {
    const orders = await Order.find({ user: userId })
      .populate('items.product', 'name price')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ user: userId });
    successResponse(res, orders, { total, page, limit });
  } catch (error) {
    errorResponse(res, 'Error fetching orders for user', error);
  }
};

// Create a new order
const createOrder = async (req, res) => {
  const { userId, items } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain items' });
    }

    let totalAmount = 0;

    // Validate and calculate order items
    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          throw new Error(`Product with ID "${item.product}" not found`);
        }

        totalAmount += product.price * item.quantity;
        return {
          product: product._id,
          quantity: item.quantity,
          price: product.price,
        };
      })
    );

    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
    });

    await order.save();
    successResponse(res, order, { message: 'Order created successfully' });
  } catch (error) {
    errorResponse(res, 'Error creating order', error);
  }
};

// Update an order status by ID
const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.updateStatus(status);
    await order.save();
    successResponse(res, order, { message: 'Order status updated successfully' });
  } catch (error) {
    errorResponse(res, 'Error updating order status', error);
  }
};

// Delete an order by ID
const deleteOrder = async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    successResponse(res, order, { message: 'Order deleted successfully' });
  } catch (error) {
    errorResponse(res, 'Error deleting order', error);
  }
};

// Middleware exports
const applyPagination = paginate;

module.exports = {
  applyPagination,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrderStatus,
  deleteOrder,
};
