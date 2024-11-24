const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cuisineType: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
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
      },
    ],
    isVRExperience: {
      type: Boolean,
      default: false,
    },
    maxCapacity: {
      type: Number,
    },
    reservationTimeSlots: [
      {
        type: String,
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
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dish',
      },
    ],
    menus: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Menu',
      },
    ],
    images: [
      {
        type: String,
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

// Add text index for search functionality
restaurantSchema.index({ name: 'text', description: 'text', cuisineType: 'text' });

// Pre-save hook to ensure slug uniqueness and update the `updatedAt` timestamp
restaurantSchema.pre('save', async function (next) {
  // Handle slug uniqueness
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
    const restaurantsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (restaurantsWithSlug.length > 0) {
      this.slug = `${this.slug}-${restaurantsWithSlug.length + 1}`;
    }
  }

  // Update the `updatedAt` timestamp
  this.updatedAt = Date.now();
  next();
});

// Ensure virtual fields are included in JSON and Object outputs
restaurantSchema.set('toObject', { virtuals: true });
restaurantSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);
