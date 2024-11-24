const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    availableForDelivery: {
      type: Boolean,
      default: true,
    },
    caution: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for better performance in searches
ProductSchema.index({ name: 1, slug: 1 });

// Virtual field for a formatted price
ProductSchema.virtual('formattedPrice').get(function () {
  return `¥${this.price.toFixed(2)}`;
});

// Middleware for ensuring slug uniqueness on save
ProductSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const productsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (productsWithSlug.length > 0) {
      this.slug = `${this.slug}-${productsWithSlug.length + 1}`;
    }
  }
  next();
});

// Ensure virtual fields are included in JSON and Object outputs
ProductSchema.set('toObject', { virtuals: true });
ProductSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
