// backend/routes/search.js
const express = require('express');
const router = express.Router();
const { searchItems } = require('../controllers/searchController');

console.log('Search route file is being loaded');

// Debug route for testing
router.get('/test', (req, res) => {
  console.log('Test route was hit');
  res.json({ message: 'Search route is working' });
});

// 只保留一个根路径处理器，使用 searchItems 控制器
router.get('/', searchItems);

module.exports = router;