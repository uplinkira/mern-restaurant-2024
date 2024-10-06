const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  ingredients: [{
    type: String
  }],
  allergens: [{
    type: String
  }],
  menuCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuCategory',
    required: true
  },
  chenPiAge: {
    type: Number,
    required: true
  },
  isSignatureDish: {
    type: Boolean,
    default: false
  },
  restaurant: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  }]
}, {
  timestamps: true
});

// Add text index
DishSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Dish', DishSchema);