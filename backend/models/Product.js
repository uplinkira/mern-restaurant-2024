// backend/models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: ['Food', 'Drink', 'Snack', 'Condiment', 'Other']
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: [true, 'Product must belong to a restaurant']
  },
  ingredients: [{
    type: String,
    trim: true
  }],
  allergens: [{
    type: String,
    trim: true
  }],
  stockStatus: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
    index: true
  },
  availableForDelivery: {
    type: Boolean,
    default: true,
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  caution: {
    type: String,
    trim: true,
    maxlength: 200
  },
  imageUrls: [{
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please enter a valid URL']
  }],
  relatedDishes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish'
  }],
  relatedRestaurants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// 组合索引优化
ProductSchema.index({ 
  name: 'text', 
  description: 'text',
  category: 1,
  price: 1,
  stockStatus: 1,
  isFeatured: 1,
  availableForDelivery: 1
});

// 虚拟字段 - 格式化价格
ProductSchema.virtual('formattedPrice').get(function() {
  return `¥${this.price.toFixed(2)}`;
});

// 虚拟字段 - 状态显示
ProductSchema.virtual('statusDisplay').get(function() {
  if (!this.availableForDelivery) return 'In-Store Only';
  if (this.stockStatus === 'out_of_stock') return 'Out of Stock';
  if (this.stockStatus === 'low_stock') return 'Low Stock';
  return 'Available';
});

// 实例方法 - 更新库存状态
ProductSchema.methods.updateStockStatus = function(status) {
  if (!['in_stock', 'low_stock', 'out_of_stock'].includes(status)) {
    throw new Error('Invalid stock status');
  }
  this.stockStatus = status;
  return this.save();
};

// 静态方法 - 查找可配送商品
ProductSchema.statics.findDeliverable = function() {
  return this.find({
    availableForDelivery: true,
    stockStatus: { $ne: 'out_of_stock' }
  });
};

// 静态方法 - 查找精选商品
ProductSchema.statics.findFeatured = function() {
  return this.find({ 
    isFeatured: true,
    stockStatus: { $ne: 'out_of_stock' }
  });
};

// 静态方法 - 按类别查找
ProductSchema.statics.findByCategory = function(category, options = {}) {
  const query = category === 'All' ? {} : { category };
  return this.find({
    ...query,
    ...options
  });
};

module.exports = mongoose.model('Product', ProductSchema);