// backend/routes/order.js
const express = require('express');
const router = express.Router();
const {
  applyPagination,
  getAllOrders,
  getOrderById,
  getOrdersByUser,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} = require('../controllers/orderController');
const { authMiddleware } = require('../middleware/authMiddleware');

// **GET all orders with optional pagination (Admin use only)**
router.get('/', authMiddleware, applyPagination, async (req, res) => {
  try {
    await getAllOrders(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error });
  }
});

// **GET an order by ID**
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    await getOrderById(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch order', error });
  }
});

// **GET orders by user ID**
router.get('/user/:userId', authMiddleware, applyPagination, async (req, res) => {
  try {
    await getOrdersByUser(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user orders', error });
  }
});

// **POST create a new order**
router.post('/', authMiddleware, async (req, res) => {
  try {
    await createOrder(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create order', error });
  }
});

// **PUT update the status of an order**
router.put('/:id/status', authMiddleware, async (req, res) => {
  try {
    await updateOrderStatus(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update order status', error });
  }
});

// **DELETE an order by ID**
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await deleteOrder(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete order', error });
  }
});

module.exports = router;
