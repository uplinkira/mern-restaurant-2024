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

const MENU_CATEGORIES = [
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
];

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
      index: true
    }],
    category: {
      type: String,
      required: true,
      enum: MENU_CATEGORIES,
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
      index: true
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
    priceRange: {
      min: {
        type: Number,
        required: true,
        min: 0
      },
      max: {
        type: Number,
        required: true,
        min: 0,
        validate: {
          validator: function(value) {
            return value >= this.priceRange.min;
          },
          message: 'Maximum price must be greater than minimum price'
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Optimized indexes
MenuSchema.index({ name: 'text', description: 'text' });
MenuSchema.index({ restaurants: 1, status: 1 });
MenuSchema.index({ category: 1, status: 1 });
MenuSchema.index({ restaurants: 1, category: 1, status: 1 });
MenuSchema.index({ 'priceRange.min': 1, 'priceRange.max': 1 });
MenuSchema.index({ order: 1, status: 1 });

// Optimized virtual fields with specific field selection
MenuSchema.virtual('dishes', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus',
  justOne: false,
  options: { 
    lean: true,
    select: 'name slug price description isSignatureDish allergens ingredients chenPiAge images status',
    sort: { isSignatureDish: -1, name: 1 }
  },
  match: { status: 'active' }
});

MenuSchema.virtual('dishCount', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'menus',
  count: true
});

// Optimized pre-validate middleware for relationship validation
MenuSchema.pre('validate', async function(next) {
  if (this.isModified('restaurants')) {
    try {
      const Restaurant = mongoose.model('Restaurant');
      const restaurantSlugs = [...new Set(this.restaurants)];
      
      const validRestaurants = await Restaurant.find({
        slug: { $in: restaurantSlugs },
        status: 'active'
      }).select('slug isVRExperience').lean();

      if (validRestaurants.length !== restaurantSlugs.length) {
        throw new Error('One or more restaurants are invalid or inactive');
      }

      // VR validation
      if (this.isVREnabled) {
        const hasVRRestaurant = validRestaurants.some(r => r.isVRExperience);
        if (!hasVRRestaurant) {
          throw new Error('VR-enabled menus must be associated with VR-capable restaurants');
        }
      }

      this.restaurants = restaurantSlugs;
    } catch (error) {
      next(error);
      return;
    }
  }
  next();
});

// Optimized pre-save middleware
MenuSchema.pre('save', async function(next) {
  try {
    if (this.isNew || this.isModified('slug')) {
      const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
      const existingSlugs = await this.constructor.find({ slug: slugRegEx })
        .select('slug')
        .lean();
      
      if (existingSlugs.length > 0) {
        this.slug = `${this.slug}-${existingSlugs.length + 1}`;
      }
    }

    if (this.isModified('images')) {
      const primaryImages = this.images.filter(img => img.isPrimary);
      if (primaryImages.length > 1) {
        this.images.forEach((img, index) => {
          img.isPrimary = index === 0;
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Optimized static methods
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

  let menuQuery = this.find(query)
    .select('name slug description category type status isVREnabled priceRange order')
    .sort('order')
    .lean();
  
  if (includeDishes) {
    menuQuery = menuQuery.populate({
      path: 'dishes',
      match: { status: 'active' },
      select: 'name slug price description isSignatureDish allergens ingredients chenPiAge',
      options: { 
        sort: { isSignatureDish: -1, name: 1 },
        lean: true
      }
    });
  }

  return menuQuery;
};

// Optimized instance methods
MenuSchema.methods.isAvailable = function(date = new Date()) {
  const day = date.toLocaleString('en-us', { weekday: 'long' });
  const time = date.toLocaleString('en-us', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

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

  const hours = this.availableTimes?.pattern?.[day];
  if (!hours || hours.closed) return false;
  
  return time >= hours.open && time <= hours.close;
};

// Optimized relationship methods with batched operations
MenuSchema.methods.addDish = async function(dishSlug) {
  const Dish = mongoose.model('Dish');
  const dish = await Dish.findOneAndUpdate(
    { 
      slug: dishSlug, 
      status: 'active',
      menus: { $ne: this.slug }
    },
    { $addToSet: { menus: this.slug } },
    { 
      new: true,
      select: 'slug'
    }
  );

  if (!dish) {
    throw new Error('Dish not found, inactive, or already added');
  }

  return this;
};

MenuSchema.methods.removeDish = async function(dishSlug) {
  await mongoose.model('Dish').updateOne(
    { slug: dishSlug },
    { $pull: { menus: this.slug } }
  );

  return this;
};

module.exports = mongoose.model('Menu', MenuSchema);