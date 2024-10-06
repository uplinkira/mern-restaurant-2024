const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  cuisineType: {  // Changed from cuisine to cuisineType
    type: String,
    required: true,
    trim: true
  },
  address: {  // Changed to a single string
    type: String,
    required: true
  },
  phone: { 
    type: String,
    required: true
  },
  email: { 
    type: String,
    required: true,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  website: {  // Added
    type: String,
    trim: true
  },
  openingHours: {  // Changed to match JSON structure
    Monday: String,
    Tuesday: String,
    Wednesday: String,
    Thursday: String,
    Friday: String,
    Saturday: String,
    Sunday: String
  },
  specialties: [{  // Added
    type: String
  }],
  isVRExperience: {  // Added
    type: Boolean,
    default: false
  },
  maxCapacity: {  // Added
    type: Number
  },
  reservationTimeSlots: [{  // Added
    type: String
  }],
  rating: { 
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  priceRange: { 
    type: String,
    enum: ['$', '$$', '$$$', '$$$$'],
    default: '$$'
  },
  dishes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dish' 
  }],
  images: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Add text index
restaurantSchema.index({ name: 'text', description: 'text', cuisineType: 'text' });

// Add any pre-save hooks, virtual properties, or methods here if needed
restaurantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);