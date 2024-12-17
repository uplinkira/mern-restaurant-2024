const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrdersByUser,
  getAllOrders
} = require('../controllers/orderController');

// Debug middleware
router.use((req, res, next) => {
  console.log('Order route accessed:', {
    method: req.method,
    path: req.path,
    userId: req.userId
  });
  next();
});

// Protect all routes
router.use(authMiddleware);

// Admin routes
router.get('/admin/all', async (req, res, next) => {
  // Check admin rights
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  await getAllOrders(req, res, next);
});

// User routes
router.get('/user/me', getOrdersByUser); // Get current user's orders
router.get('/user/:userId', async (req, res, next) => {
  // Only allow admin or the user themselves to access
  if (!req.user?.isAdmin && req.userId !== req.params.userId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access these orders'
    });
  }
  await getOrdersByUser(req, res, next);
});

// Standard routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.patch('/:orderId/status', updateOrderStatus);
router.post('/:orderId/cancel', cancelOrder);

module.exports = router; 