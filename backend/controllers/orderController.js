const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Create a new order
const createOrder = async (req, res) => {
  try {
    const user = req.user;
    const cart = await Cart.findOne({ user: user._id }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'No items in cart' });
    }

    const order = new Order({
      user: user._id,
      items: cart.items,
      totalPrice: cart.totalPrice,
      status: 'pending',
      paymentMethod: req.body.paymentMethod
    });

    const savedOrder = await order.save();
    await cart.updateOne({ items: [], totalPrice: 0 });

    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to place order', error });
  }
};

// Get user's order history
const getOrderHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    order.updatedAt = Date.now();

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error });
  }
};

module.exports = {
  createOrder,
  getOrderHistory,
  updateOrderStatus
};
