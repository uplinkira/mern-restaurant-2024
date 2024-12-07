// backend/models/Menu.js
const mongoose = require('mongoose');

const openingHoursSchema = new mongoose.Schema({
  open: {
    type: String,
    required: [true, 'Opening time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Opening time must be in HH:MM format'
    }
  },
  close: {
    type: String,
    required: [true, 'Closing time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Closing time must be in HH:MM format'
    }
  },
  closed: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const MenuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be longer than 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be longer than 500 characters'],
    },
    restaurants: [{
      type: String,
      ref: 'Restaurant',
      required: [true, 'At least one restaurant is required'],
      validate: {
        validator: async function(slug) {
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
    category: {
      type: String,
      required: true,
      enum: [
        'Chen Pi Prelude',
        'Chen Pi Main Symphony',
        'Chen Pi Sweet Finale',
        'Chen Pi Elixirs',
        'VR Chen Pi Journey',
        'Chen Pi Wellness',
        'Legacy of Chen Pi',
        'Molecular Chen Pi Creations',
        'Chen Pi Hot Pot Feast',
        'Chen Pi Street Eats'
      ],
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['regular', 'seasonal', 'special', 'vr-experience'],
      default: 'regular'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'seasonal', 'coming_soon'],
      default: 'active',
      index: true,
    },
    availableTimes: {
      pattern: {
        Monday: openingHoursSchema,
        Tuesday: openingHoursSchema,
        Wednesday: openingHoursSchema,
        Thursday: openingHoursSchema,
        Friday: openingHoursSchema,
        Saturday: openingHoursSchema,
        Sunday: openingHoursSchema
      },
      seasonal: {
        startDate: Date,
        endDate: Date,
        repeatYearly: {
          type: Boolean,
          default: false
        }
      }
    },
    isVREnabled: {
      type: Boolean,
      default: false
    },
    images: [{
      url: {
        type: String,
        required: true,
        match: [/^https?:\/\/.+/, 'Please enter a valid URL']
      },
      alt: {
        type: String,
        required: true
      },
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    order: {
      type: Number,
      default: 0,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    featuredDishes: [{
      type: String,
      ref: 'Dish'
    }],
    requiresReservation: {
      type: Boolean,
      default: false
    },
    minimumDiners: {
      type: Number,
      min: 1,
      default: 1
    },
    maximumDiners: {
      type: Number,
      min: 1
    },
    priceCategories: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      description: {
        type: String,
        trim: true
      },
      price: {
        type: Number,
        required: true,
        min: 0
      }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
MenuSchema.index({ name: 'text', description: 'text' });
MenuSchema.index({ restaurants: 1, status: 1 });
MenuSchema.index({ category: 1, status: 1 });
MenuSchema.index({ restaurants: 1, category: 1, status: 1 });
MenuSchema.index({ 'priceCategories.price': 1 });

// Virtual field for dishes with enhanced population
MenuSchema.virtual('dishes', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus',
  justOne: false,
  options: { lean: true },
  match: { status: 'active' }
});

// Virtual field for dish count
MenuSchema.virtual('dishCount', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus',
  count: true
});

// Enhanced pre-save middleware
MenuSchema.pre('save', async function(next) {
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

    // VR validation
    if (this.isVREnabled) {
      const vrRestaurants = await mongoose.model('Restaurant').find({
        slug: { $in: this.restaurants },
        isVRExperience: true
      });
      if (vrRestaurants.length === 0) {
        throw new Error('VR-enabled menus must be associated with VR-capable restaurants');
      }
    }

    // Validate restaurant references
    if (this.isModified('restaurants')) {
      const Restaurant = mongoose.model('Restaurant');
      const restaurants = await Restaurant.find({ 
        slug: { $in: this.restaurants },
        status: { $ne: 'inactive' }
      });

      if (restaurants.length !== this.restaurants.length) {
        throw new Error('One or more restaurant references are invalid or inactive');
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
MenuSchema.statics.findByRestaurant = async function(restaurantSlug, options = {}) {
  const { 
    category, 
    status = 'active', 
    includeDishes = true,
    includeInactive = false
  } = options;

  const query = {
    restaurants: restaurantSlug,
    status: includeInactive ? { $ne: 'inactive' } : status
  };

  if (category) query.category = category;

  let menuQuery = this.find(query).sort('order');
  
  if (includeDishes) {
    menuQuery = menuQuery.populate({
      path: 'dishes',
      match: { status: 'active' },
      select: 'name slug price description isSignatureDish',
      options: { sort: { isSignatureDish: -1, name: 1 } }
    });
  }

  return menuQuery;
};

// Instance methods
MenuSchema.methods.isAvailable = function(date = new Date()) {
  const day = date.toLocaleString('en-us', { weekday: 'long' });
  const time = date.toLocaleString('en-us', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // Check seasonal availability
  if (this.availableTimes?.seasonal) {
    const { startDate, endDate, repeatYearly } = this.availableTimes.seasonal;
    const currentDate = date.getTime();
    
    if (repeatYearly) {
      const currentYear = date.getFullYear();
      const startYear = new Date(startDate).setFullYear(currentYear);
      const endYear = new Date(endDate).setFullYear(currentYear);
      
      if (!(currentDate >= startYear && currentDate <= endYear)) {
        return false;
      }
    } else if (!(currentDate >= startDate && currentDate <= endDate)) {
      return false;
    }
  }

  // Check daily availability
  const hours = this.availableTimes?.pattern?.[day];
  if (!hours || hours.closed) return false;
  
  return time >= hours.open && time <= hours.close;
};

MenuSchema.methods.addDish = async function(dishSlug) {
  const Dish = mongoose.model('Dish');
  const dish = await Dish.findOne({ slug: dishSlug, status: 'active' });

  if (!dish) {
    throw new Error('Dish not found or inactive');
  }

  if (!dish.menus.includes(this.slug)) {
    dish.menus.push(this.slug);
    await dish.save();
  }

  return this;
};

MenuSchema.methods.removeDish = async function(dishSlug) {
  const Dish = mongoose.model('Dish');
  const dish = await Dish.findOne({ slug: dishSlug });

  if (dish) {
    dish.menus = dish.menus.filter(slug => slug !== this.slug);
    await dish.save();
  }

  return this;
};

module.exports = mongoose.model('Menu', MenuSchema);