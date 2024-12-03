// backend/models/Product.js
const mongoose = require('mongoose');

// Define the Product schema
const ProductSchema = new mongoose.Schema(
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
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Food', 'Drink', 'Snack', 'Condiment', 'Other'], // Predefined categories
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    availableForDelivery: {
      type: Boolean,
      default: true,
    },
    caution: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    relatedDishes: [
      {
        type: String, // Refers to Dish by slug
        ref: 'Dish',
      },
    ],
    relatedRestaurants: [
      {
        type: String, // Refers to Restaurant by slug
        ref: 'Restaurant',
      },
    ],
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrls: [
      {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL'], // Ensure URLs are valid
      },
    ],
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing for improved search and query performance
ProductSchema.index({ name: 'text', description: 'text', category: 1, price: 1 });

// Virtual field to populate related dishes
ProductSchema.virtual('dishDetails', {
  ref: 'Dish',
  localField: 'relatedDishes',
  foreignField: 'slug',
  justOne: false,
});

// Virtual field to populate related restaurants
ProductSchema.virtual('restaurantDetails', {
  ref: 'Restaurant',
  localField: 'relatedRestaurants',
  foreignField: 'slug',
  justOne: false,
});

// Virtual field for formatted price
ProductSchema.virtual('formattedPrice').get(function () {
  return `¥${this.price.toFixed(2)}`;
});

// Middleware for ensuring slug uniqueness on save
ProductSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const productsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (productsWithSlug.length > 0) {
      this.slug = `${this.slug}-${productsWithSlug.length + 1}`;
    }
  }
  next();
});

// Pre-update middleware to update timestamps
ProductSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Static method to find featured products
ProductSchema.statics.findFeatured = function () {
  return this.find({ isFeatured: true });
};

// Static method to find products by category
ProductSchema.statics.findByCategory = function (category) {
  return this.find({ category });
};

// Static method to search products by keyword
ProductSchema.statics.searchProducts = function (keyword) {
  const searchRegEx = new RegExp(keyword, 'i');
  return this.find({
    $or: [{ name: searchRegEx }, { description: searchRegEx }],
  });
};

// Instance method to add related dishes
ProductSchema.methods.addRelatedDish = function (dishSlug) {
  if (!this.relatedDishes.includes(dishSlug)) {
    this.relatedDishes.push(dishSlug);
  }
  return this.save();
};

// Instance method to remove related dish
ProductSchema.methods.removeRelatedDish = function (dishSlug) {
  this.relatedDishes = this.relatedDishes.filter((slug) => slug !== dishSlug);
  return this.save();
};

// Instance method to toggle featured status
ProductSchema.methods.toggleFeatured = function () {
  this.isFeatured = !this.isFeatured;
  return this.save();
};

module.exports = mongoose.model('Product', ProductSchema);
