// backend/models/Menu.js
const mongoose = require('mongoose');

// Define the Menu schema
const MenuSchema = new mongoose.Schema(
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
    restaurants: [
      {
        type: String, // Use slug reference
        ref: 'Restaurant',
        required: true,
      },
    ],
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Include virtuals in JSON responses
    toObject: { virtuals: true },
  }
);

// Indexing for efficient queries
MenuSchema.index({ name: 'text', slug: 1 });

// Virtual field to populate related dishes
MenuSchema.virtual('dishes', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus', // Reference dishes by their menus field
  justOne: false,
});

// Static method to find menus by restaurant slug
MenuSchema.statics.findByRestaurantSlug = function (restaurantSlug) {
  return this.find({ restaurants: restaurantSlug }).populate('dishes');
};

// Instance method to add a restaurant to the menu by slug
MenuSchema.methods.addRestaurant = async function (restaurantSlug) {
  if (!this.restaurants.includes(restaurantSlug)) {
    this.restaurants.push(restaurantSlug);
  }
  return this.save();
};

// Instance method to remove a restaurant from the menu by slug
MenuSchema.methods.removeRestaurant = async function (restaurantSlug) {
  this.restaurants = this.restaurants.filter((slug) => slug !== restaurantSlug);
  return this.save();
};

// Middleware to ensure slug uniqueness
MenuSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const existingSlugs = await this.constructor.find({ slug: slugRegEx });
    if (existingSlugs.length > 0) {
      this.slug = `${this.slug}-${existingSlugs.length + 1}`;
    }
  }
  next();
});

// Middleware to log menu creation
MenuSchema.pre('save', function (next) {
  if (this.isNew) {
    console.log(`Creating new menu: ${this.name}`);
  }
  next();
});

// Static method to search menus by keyword
MenuSchema.statics.searchMenus = function (keyword) {
  const searchRegEx = new RegExp(keyword, 'i');
  return this.find({
    $or: [{ name: searchRegEx }, { description: searchRegEx }],
  });
};

// Export the Menu model
module.exports = mongoose.model('Menu', MenuSchema);
