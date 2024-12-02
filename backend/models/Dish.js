const mongoose = require('mongoose');

// Define the Dish schema
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
    menus: [
      {
        type: String, // Use slug reference
        ref: 'Menu',
        required: true,
      },
    ],
    chenPiAge: {
      type: Number,
      required: true,
      min: 0,
    },
    isSignatureDish: {
      type: Boolean,
      default: false,
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

// Index for full-text search
DishSchema.index({ name: 'text', description: 'text' });

// Virtual field to populate related menu details based on slug
DishSchema.virtual('menuDetails', {
  ref: 'Menu',
  localField: 'menus',
  foreignField: 'slug', // Reference Menu by slug
  justOne: false,
});

// Virtual field to populate related restaurant details based on slug
DishSchema.virtual('restaurantDetails', {
  ref: 'Restaurant',
  localField: 'restaurants',
  foreignField: 'slug', // Reference Restaurant by slug
  justOne: false,
});

// Middleware: Ensure slug uniqueness
DishSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const existingSlugs = await this.constructor.find({ slug: slugRegEx });
    if (existingSlugs.length > 0) {
      this.slug = `${this.slug}-${existingSlugs.length + 1}`;
    }
  }
  next();
});

// Middleware: Log when a dish is created
DishSchema.pre('save', function (next) {
  if (this.isNew) {
    console.log(`Creating new dish: ${this.name}`);
  }
  next();
});

// Static method to search dishes by keywords
DishSchema.statics.searchDishes = function (keyword) {
  const searchRegEx = new RegExp(keyword, 'i');
  return this.find({
    $or: [{ name: searchRegEx }, { description: searchRegEx }],
  });
};

// Instance method to calculate price with tax
DishSchema.methods.calculatePriceWithTax = function (taxRate) {
  return this.price + this.price * taxRate;
};

// Static method to get all signature dishes
DishSchema.statics.getSignatureDishes = function () {
  return this.find({ isSignatureDish: true });
};

// Export the Dish model
module.exports = mongoose.model('Dish', DishSchema);
