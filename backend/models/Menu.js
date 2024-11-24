const mongoose = require('mongoose');

const MenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    restaurants: [
      {
        type: String, // Using slug reference instead of ObjectId
        ref: 'Restaurant',
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
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Indexing the 'name' and 'slug' fields for better performance
MenuSchema.index({ name: 1, slug: 1 });

// Virtual attribute to get the related dishes for the menu based on slug
MenuSchema.virtual('dishes', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus',
  justOne: false, // Allow multiple dishes to be populated
});

// Method to add a restaurant to the menu by slug
MenuSchema.methods.addRestaurant = function (restaurantSlug) {
  if (!this.restaurants.includes(restaurantSlug)) {
    this.restaurants.push(restaurantSlug);
  }
  return this.save();
};

// Method to remove a restaurant from the menu by slug
MenuSchema.methods.removeRestaurant = function (restaurantSlug) {
  this.restaurants = this.restaurants.filter((slug) => slug !== restaurantSlug);
  return this.save();
};

// Static method to find menus by restaurant slug
MenuSchema.statics.findByRestaurant = function (restaurantSlug) {
  return this.find({ restaurants: restaurantSlug }).populate('restaurants');
};

// Pre-save middleware to ensure slug uniqueness
MenuSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const menusWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (menusWithSlug.length > 0) {
      this.slug = `${this.slug}-${menusWithSlug.length + 1}`;
    }
  }
  next();
});

// Ensure virtual attributes are visible in JSON outputs
MenuSchema.set('toJSON', { virtuals: true });
MenuSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Menu', MenuSchema);
