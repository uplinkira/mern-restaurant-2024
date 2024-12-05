// backend/models/Restaurant.js
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

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot be longer than 100 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be longer than 1000 characters'],
    },
    cuisineType: {
      type: String,
      required: [true, 'Cuisine type is required'],
      trim: true,
      index: true,
    },
    address: {
      street: {
        type: String,
        required: [true, 'Street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true,
      },
      zipCode: {
        type: String,
        required: [true, 'ZIP code is required'],
        trim: true,
      },
      country: {
        type: String,
        required: [true, 'Country is required'],
        trim: true,
      }
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[0-9\s\-]+$/, 'Please enter a valid phone number'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
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
      Monday: openingHoursSchema,
      Tuesday: openingHoursSchema,
      Wednesday: openingHoursSchema,
      Thursday: openingHoursSchema,
      Friday: openingHoursSchema,
      Saturday: openingHoursSchema,
      Sunday: openingHoursSchema,
    },
    specialties: [{
      type: String,
      trim: true,
    }],
    isVRExperience: {
      type: Boolean,
      default: false,
      index: true,
    },
    maxCapacity: {
      type: Number,
      min: [0, 'Maximum capacity cannot be negative'],
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'temporarily_closed', 'coming_soon'],
      default: 'active',
      index: true,
    },
    reservationTimeSlots: [{
      time: {
        type: String,
        required: true,
        validate: {
          validator: function(v) {
            return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      maxBookings: {
        type: Number,
        required: true,
        min: [1, 'Maximum bookings must be at least 1']
      }
    }],
    rating: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      }
    },
    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      default: '$$',
      index: true,
    },
    dishes: [{
      type: String,
      ref: 'Dish',
      validate: {
        validator: async function(slug) {
          const Dish = mongoose.model('Dish');
          const dish = await Dish.findOne({ slug, status: 'active' });
          return dish !== null;
        },
        message: 'Referenced dish does not exist or is inactive'
      }
    }],
    menus: [{
      type: String,
      ref: 'Menu',
      validate: {
        validator: async function(slug) {
          const Menu = mongoose.model('Menu');
          const menu = await Menu.findOne({ slug, status: 'active' });
          return menu !== null;
        },
        message: 'Referenced menu does not exist or is inactive'
      }
    }],
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
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
restaurantSchema.index({ name: 'text', description: 'text', cuisineType: 'text' });
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ status: 1, cuisineType: 1 });
restaurantSchema.index({ status: 1, priceRange: 1 });

// Virtual fields with improved population
restaurantSchema.virtual('dishDetails', {
  ref: 'Dish',
  localField: 'dishes',
  foreignField: 'slug',
  justOne: false,
  options: { lean: true },
  match: { status: 'active' }
});

restaurantSchema.virtual('menuDetails', {
  ref: 'Menu',
  localField: 'menus',
  foreignField: 'slug',
  justOne: false,
  options: { lean: true },
  match: { status: 'active' }
});

// Enhanced pre-save middleware
restaurantSchema.pre('save', async function(next) {
  try {
    // Slug uniqueness
    if (this.isNew || this.isModified('slug')) {
      const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
      const existingSlugs = await this.constructor.find({ slug: slugRegEx });
      if (existingSlugs.length > 0) {
        this.slug = `${this.slug}-${existingSlugs.length + 1}`;
      }
    }

    // Ensure only one primary image
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

// Enhanced static methods
restaurantSchema.statics.findNearby = async function(coords, maxDistance = 10000) {
  return this.find({
    status: 'active',
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coords
        },
        $maxDistance: maxDistance
      }
    }
  }).select('name slug location rating priceRange');
};

restaurantSchema.statics.searchRestaurants = async function(params) {
  const { 
    keyword, 
    cuisineType, 
    priceRange, 
    isVRExperience,
    status = 'active',
    location,
    radius
  } = params;

  const query = { status };

  if (keyword) {
    query.$text = { $search: keyword };
  }
  if (cuisineType) {
    query.cuisineType = cuisineType;
  }
  if (priceRange) {
    query.priceRange = priceRange;
  }
  if (typeof isVRExperience === 'boolean') {
    query.isVRExperience = isVRExperience;
  }
  if (location && radius) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: location
        },
        $maxDistance: radius
      }
    };
  }

  return this.find(query)
    .populate('menuDetails', 'name slug')
    .populate({
      path: 'dishDetails',
      match: { isSignatureDish: true },
      select: 'name slug price'
    });
};

// Enhanced instance methods
restaurantSchema.methods.isOpen = function(date = new Date()) {
  const day = date.toLocaleString('en-us', { weekday: 'long' });
  const time = date.toLocaleString('en-us', { hour: '2-digit', minute: '2-digit', hour12: false });
  
  const hours = this.openingHours[day];
  if (!hours || hours.closed) return false;
  
  return time >= hours.open && time <= hours.close;
};

restaurantSchema.methods.addDish = async function(dishSlug) {
  const Dish = mongoose.model('Dish');
  const dish = await Dish.findOne({ slug: dishSlug, status: 'active' });
  
  if (!dish) {
    throw new Error('Dish not found or inactive');
  }

  if (!this.dishes.includes(dishSlug)) {
    this.dishes.push(dishSlug);
    await this.save();
    await dish.addToRestaurant(this.slug);
  }
  return this;
};

restaurantSchema.methods.removeDish = async function(dishSlug) {
  const Dish = mongoose.model('Dish');
  const dish = await Dish.findOne({ slug: dishSlug });
  
  this.dishes = this.dishes.filter(slug => slug !== dishSlug);
  await this.save();
  
  if (dish) {
    await dish.removeFromRestaurant(this.slug);
  }
  return this;
};

restaurantSchema.methods.addMenu = async function(menuSlug) {
  const Menu = mongoose.model('Menu');
  const menu = await Menu.findOne({ slug: menuSlug, status: 'active' });
  
  if (!menu) {
    throw new Error('Menu not found or inactive');
  }

  if (!this.menus.includes(menuSlug)) {
    this.menus.push(menuSlug);
    await this.save();
    await menu.addRestaurant(this.slug);
  }
  return this;
};

restaurantSchema.methods.removeMenu = async function(menuSlug) {
  const Menu = mongoose.model('Menu');
  const menu = await Menu.findOne({ slug: menuSlug });
  
  this.menus = this.menus.filter(slug => slug !== menuSlug);
  await this.save();
  
  if (menu) {
    await menu.removeRestaurant(this.slug);
  }
  return this;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);