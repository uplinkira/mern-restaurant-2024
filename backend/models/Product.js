// backend/models/Product.js
const mongoose = require('mongoose');

// Define the Product schema
const ProductSchema = new mongoose.Schema(
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
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      enum: ['Food', 'Drink', 'Snack', 'Condiment', 'Other'],
    },
    ingredients: [{
      type: String,
      trim: true,
    }],
    allergens: [{
      type: String,
      trim: true,
    }],
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
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    imageUrls: [{
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid URL'],
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 只保留必要的索引
ProductSchema.index({ name: 'text', description: 'text', category: 1, price: 1 });

// 虚拟字段 - 格式化价格
ProductSchema.virtual('formattedPrice').get(function() {
  return `¥${this.price.toFixed(2)}`;
});

// 保留 slug 唯一性检查
ProductSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('slug')) {
    const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*)?$)`, 'i');
    const productsWithSlug = await this.constructor.find({ slug: slugRegEx });
    if (productsWithSlug.length > 0) {
      this.slug = `${this.slug}-${productsWithSlug.length + 1}`;
    }
  }
  next();
});

// 更新时间戳
ProductSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// 只保留必要的静态方法
ProductSchema.statics.findFeatured = function() {
  return this.find({ isFeatured: true });
};

ProductSchema.statics.findByCategory = function(category) {
  return this.find({ category });
};

module.exports = mongoose.model('Product', ProductSchema);
