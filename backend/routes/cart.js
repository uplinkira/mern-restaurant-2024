// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  checkDeliveryAvailability
} = require('../controllers/cartController');

// Debug middleware for cart routes
router.use((req, res, next) => {
  console.log('Cart route accessed:', {
    method: req.method,
    path: req.path,
    fullPath: req.originalUrl,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: {
      'content-type': req.headers['content-type'],
      'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : 'None'
    }
  });
  next();
});

// Protect all routes
router.use(authMiddleware);

// Cart routes with logging
router.get('/', (req, res, next) => {
  console.log('GET cart - Request received');
  getCart(req, res, next);
});

router.post('/add', (req, res, next) => {
  console.log('POST cart/add - Request received:', req.body);
  addToCart(req, res, next);
});

// Handle both PATCH and PUT requests for update
router.patch('/update', (req, res, next) => {
  console.log('PATCH cart/update - Request received:', req.body);
  updateCartItem(req, res, next);
});

router.put('/update', (req, res, next) => {
  console.log('PUT cart/update - Request received:', req.body);
  updateCartItem(req, res, next);
});

// Handle both DELETE methods
router.delete('/remove', (req, res, next) => {
  console.log('DELETE cart/remove - Request received:', {
    body: req.body,
    query: req.query,
    params: req.params
  });
  removeFromCart(req, res, next);
});

router.delete('/clear', (req, res, next) => {
  console.log('DELETE cart/clear - Request received');
  clearCart(req, res, next);
});

router.get('/check-delivery', (req, res, next) => {
  console.log('GET cart/check-delivery - Request received');
  checkDeliveryAvailability(req, res, next);
});

// Add route with URL parameter as fallback
router.delete('/remove/:productId', (req, res, next) => {
  console.log('DELETE cart/remove/:productId - Request received:', {
    params: req.params
  });
  removeFromCart(req, res, next);
});

// Catch-all route for debugging
router.all('*', (req, res) => {
  console.log('Unmatched cart route:', {
    method: req.method,
    path: req.path,
    fullPath: req.originalUrl
  });
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.path}`
  });
});

module.exports = router;
