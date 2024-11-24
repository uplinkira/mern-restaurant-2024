const mongoose = require('mongoose');

const DishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    ingredients: [
      {
        type: String,
        trim: true,
      },
    ],
    allergens: [
      {
        type: String,
        trim: true,
      },
    ],
    menus: [{
      type: String, // Changing from ObjectId to slug reference
      ref: 'Menu',
      required: true,
    }],
    chenPiAge: {
      type: Number,
      required: true,
      min: 0,
    },
    isSignatureDish: {
      type: Boolean,
      default: false,
    },
    restaurants: [{
      type: String, // Changing from ObjectId to slug reference
      ref: 'Restaurant',
      required: true,
    }],
    slug: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search functionality
DishSchema.index({ name: 'text', description: 'text' });

// Pre-save hook to log dish creation
DishSchema.pre('save', function (next) {
  console.log(`Creating dish: ${this.name}`);
  next();
});

// Virtual field to populate related menu details based on slugs
DishSchema.virtual('menuDetails', {
  ref: 'Menu',
  localField: 'menus',
  foreignField: 'slug', // Using slug instead of ObjectId
  justOne: false,
});

// Virtual field to populate related restaurant details based on slugs
DishSchema.virtual('restaurantDetails', {
  ref: 'Restaurant',
  localField: 'restaurants',
  foreignField: 'slug', // Using slug instead of ObjectId
  justOne: false,
});

// Ensure virtuals are included in the JSON output
DishSchema.set('toObject', { virtuals: true });
DishSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Dish', DishSchema);
