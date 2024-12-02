// backend/models/Restaurant.js
const mongoose = require('mongoose');

// Define the Restaurant schema
const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    cuisineType: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      match: [/^\+?[0-9\s\-]+$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    website: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?[\w\-\.]+(\.\w+)+.*$/, 'Please enter a valid URL'],
    },
    openingHours: {
      Monday: String,
      Tuesday: String,
      Wednesday: String,
      Thursday: String,
      Friday: String,
      Saturday: String,
      Sunday: String,
    },
    specialties: [
      {
        type: String,
        trim: true,
      },
    ],
    isVRExperience: {
      type: Boolean,
      default: false,
    },
    maxCapacity: {
      type: Number,
      min: 0,
      default: null,
    },
    reservationTimeSlots: [
      {
        type: String,
        trim: true,
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      default: '$$',
    },
    dishes: [
      {
        type: String, // Use slug reference
        ref: 'Dish',
      },
    ],
    menus: [
      {
        type: String, // Use slug reference
        ref: 'Menu',
      },
    ],
    images: [
      {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
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
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexing for efficient search
restaurantSchema.index({ name: 'text', description: 'text', cuisineType: 'text' });

// Virtual field to populate dishes
restaurantSchema.virtual('dishDetails', {
  ref: 'Dish',
  localField: 'dishes',
  foreignField: 'slug',
  justOne: false,
});

// Virtual field to populate menus
restaurantSchema.virtual('menuDetails', {
  ref: 'Menu',
  localField: 'menus',
  foreignField: 'slug',
  justOne: false,
});

// Middleware to ensure slug uniqueness
restaurantSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const existingSlugs = await this.constructor.find({ slug: slugRegEx });
    if (existingSlugs.length > 0) {
      this.slug = `${this.slug}-${existingSlugs.length + 1}`;
    }
  }
  next();
});

// Middleware to update `updatedAt` on updates
restaurantSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Static method to search restaurants by keyword
restaurantSchema.statics.searchRestaurants = function (keyword) {
  const searchRegEx = new RegExp(keyword, 'i');
  return this.find({
    $or: [{ name: searchRegEx }, { description: searchRegEx }],
  });
};

// Static method to find restaurants by cuisine type
restaurantSchema.statics.findByCuisine = function (cuisineType) {
  return this.find({ cuisineType: new RegExp(cuisineType, 'i') });
};

// Instance method to add a dish to the restaurant
restaurantSchema.methods.addDish = async function (dishSlug) {
  if (!this.dishes.includes(dishSlug)) {
    this.dishes.push(dishSlug);
  }
  return this.save();
};

// Instance method to remove a dish from the restaurant
restaurantSchema.methods.removeDish = async function (dishSlug) {
  this.dishes = this.dishes.filter((slug) => slug !== dishSlug);
  return this.save();
};

// Instance method to add a menu to the restaurant
restaurantSchema.methods.addMenu = async function (menuSlug) {
  if (!this.menus.includes(menuSlug)) {
    this.menus.push(menuSlug);
  }
  return this.save();
};

// Instance method to remove a menu from the restaurant
restaurantSchema.methods.removeMenu = async function (menuSlug) {
  this.menus = this.menus.filter((slug) => slug !== menuSlug);
  return this.save();
};

// Export the Restaurant model
module.exports = mongoose.model('Restaurant', restaurantSchema);
