const express = require('express');
const router = express.Router();
const Dish = require('../models/Dish');

// Fetch dish details by ID
router.get('/:id', async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.json(dish);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
