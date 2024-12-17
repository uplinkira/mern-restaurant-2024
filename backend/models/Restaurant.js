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
    description: String,
    cuisineType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phone: String,
    email: String,
    website: String,
    openingHours: {
      Monday: String,
      Tuesday: String,
      Wednesday: String,
      Thursday: String,
      Friday: String,
      Saturday: String,
      Sunday: String
    },
    specialties: [String],
    isVRExperience: {
      type: Boolean,
      default: false
    },
    maxCapacity: Number,
    reservationTimeSlots: [String],
    rating: {
      type: Number,
      default: 0
    },
    images: [{
      url: String,
      alt: String,
      isPrimary: Boolean
    }],
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 使用虚拟字段进行反向引用
restaurantSchema.virtual('menuList', {
  ref: 'Menu',
  localField: 'slug',
  foreignField: 'restaurants',
  justOne: false,
  options: { 
    sort: { order: 1 },
    match: { status: 'active' }
  }
});

restaurantSchema.virtual('dishList', {
  ref: 'Dish',
  localField: 'slug',
  foreignField: 'restaurants',
  justOne: false
});

// Indexes
restaurantSchema.index({ name: 'text', description: 'text', cuisineType: 'text' });
restaurantSchema.index({ location: '2dsphere' });

// 只保留必要的实例方法
restaurantSchema.methods.isOpen = function(date = new Date()) {
  const day = date.toLocaleString('en-us', { weekday: 'long' });
  const timeString = this.openingHours[day];
  if (!timeString) return false;
  
  const [open, close] = timeString.split('-').map(t => t.trim());
  const time = date.toLocaleString('en-us', { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  
  return time >= open && time <= close;
};

module.exports = mongoose.model('Restaurant', restaurantSchema);