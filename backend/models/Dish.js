// backend/models/Dish.js

const mongoose = require('mongoose');

// Define the Dish schema
const DishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be longer than 100 characters'],
      index: true, // Add index for faster name queries
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [500, 'Description cannot be longer than 500 characters'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    ingredients: [{
      type: String,
      trim: true,
      required: [true, 'Each ingredient must be specified'],
    }],
    allergens: [{
      type: String,
      trim: true,
      enum: {
        values: ['dairy', 'eggs', 'shellfish', 'soy', 'nuts', 'gluten'],
        message: '{VALUE} is not a supported allergen',
      },
    }],
    menus: [{
      type: String,
      ref: 'Menu',
      required: [true, 'Dish must belong to at least one menu'],
      validate: {
        validator: async function(slug) {
          // 如果是在 seeding 过程中，跳过验证
          if (this.constructor._seedingData) {
            return true;
          }
          const Menu = mongoose.model('Menu');
          const menu = await Menu.findOne({ 
            slug,
            status: { $ne: 'inactive' }
          });
          return menu !== null;
        },
        message: 'Referenced menu does not exist or is inactive'
      }
    }],
    chenPiAge: {
      type: Number,
      required: [true, 'Chen Pi age is required'],
      min: [0, 'Chen Pi age cannot be negative'],
    },
    isSignatureDish: {
      type: Boolean,
      default: false,
      index: true, // Add index for signature dish queries
    },
    restaurants: [{
      type: String,
      ref: 'Restaurant',
      required: [true, 'Dish must belong to at least one restaurant'],
      validate: {
        validator: async function(slug) {
          // 如果是在 seeding 过程中，跳过验证
          if (this.constructor._seedingData) {
            return true;
          }
          const Restaurant = mongoose.model('Restaurant');
          const restaurant = await Restaurant.findOne({ 
            slug,
            status: { $ne: 'inactive' }
          });
          return restaurant !== null;
        },
        message: 'Referenced restaurant does not exist or is inactive'
      }
    }],
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'seasonal'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for efficient queries
DishSchema.index({ name: 'text', description: 'text' });
DishSchema.index({ restaurants: 1, status: 1 });
DishSchema.index({ menus: 1, status: 1 });
DishSchema.index({ isSignatureDish: 1, status: 1 });

// Improved virtual fields with lean option support
DishSchema.virtual('menuDetails', {
  ref: 'Menu',
  localField: 'menus',
  foreignField: 'slug',
  justOne: false,
  options: { 
    lean: true,
    match: { status: { $ne: 'inactive' } }
  }
});

DishSchema.virtual('restaurantDetails', {
  ref: 'Restaurant',
  localField: 'restaurants',
  foreignField: 'slug',
  justOne: false,
  options: { 
    lean: true,
    match: { status: { $ne: 'inactive' } }
  }
});

// Pre-save middleware for slug generation and validation
DishSchema.pre('save', async function(next) {
  try {
    // 如果是在 seeding 过程中，跳过验证
    if (this.constructor._seedingData) {
      return next();
    }

    // Slug uniqueness
    if (this.isNew || this.isModified('slug')) {
      const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
      const existingSlugs = await this.constructor.find({ slug: slugRegEx });
      if (existingSlugs.length > 0) {
        this.slug = `${this.slug}-${existingSlugs.length + 1}`;
      }
    }

    // Validate restaurant and menu references
    if (this.isModified('restaurants') || this.isModified('menus')) {
      const Restaurant = mongoose.model('Restaurant');
      const Menu = mongoose.model('Menu');
      
      const [restaurants, menus] = await Promise.all([
        Restaurant.find({ slug: { $in: this.restaurants } }),
        Menu.find({ slug: { $in: this.menus } })
      ]);

      if (restaurants.length !== this.restaurants.length) {
        throw new Error('One or more restaurant references are invalid');
      }
      if (menus.length !== this.menus.length) {
        throw new Error('One or more menu references are invalid');
      }
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Enhanced static methods
DishSchema.statics.searchDishes = async function(params) {
  const { keyword, restaurant, menu, isSignature, status = 'active' } = params;
  
  const query = { status };
  
  if (keyword) {
    query.$text = { $search: keyword };
  }
  if (restaurant) {
    query.restaurants = restaurant;
  }
  if (menu) {
    query.menus = menu;
  }
  if (typeof isSignature === 'boolean') {
    query.isSignatureDish = isSignature;
  }
  
  return this.find(query)
    .populate('restaurantDetails', 'name slug cuisineType')
    .populate('menuDetails', 'name slug');
};

DishSchema.statics.getSignatureDishes = function(restaurantSlug) {
  const query = { 
    isSignatureDish: true,
    status: 'active'
  };
  
  if (restaurantSlug) {
    query.restaurants = restaurantSlug;
  }
  
  return this.find(query)
    .populate('restaurantDetails', 'name slug')
    .sort('-createdAt');
};

// Enhanced instance methods
DishSchema.methods.calculatePriceWithTax = function(taxRate) {
  return Number((this.price + (this.price * taxRate)).toFixed(2));
};

DishSchema.methods.addToRestaurant = async function(restaurantSlug) {
  if (!this.restaurants.includes(restaurantSlug)) {
    this.restaurants.push(restaurantSlug);
    await this.save();
  }
  return this;
};

DishSchema.methods.removeFromRestaurant = async function(restaurantSlug) {
  this.restaurants = this.restaurants.filter(slug => slug !== restaurantSlug);
  await this.save();
  return this;
};

DishSchema.methods.addToMenu = async function(menuSlug) {
  if (!this.menus.includes(menuSlug)) {
    this.menus.push(menuSlug);
    await this.save();
  }
  return this;
};

DishSchema.methods.removeFromMenu = async function(menuSlug) {
  this.menus = this.menus.filter(slug => slug !== menuSlug);
  await this.save();
  return this;
};

// Export the model
module.exports = mongoose.model('Dish', DishSchema);