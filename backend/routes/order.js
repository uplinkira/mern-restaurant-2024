const express = require('express');
const router = express.Router();
const { createOrder, getOrderHistory, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware'); // Auth middleware for user validation

// Create a new order
router.post('/', authMiddleware, createOrder);

// Get user's order history
router.get('/', authMiddleware, getOrderHistory);

// Update order status (for admins or managers)
router.put('/:id/status', authMiddleware, updateOrderStatus);

module.exports = router;
