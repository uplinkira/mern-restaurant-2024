const mongoose = require('mongoose');

// Define schema for order items
const OrderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate subtotal for each item
OrderItemSchema.virtual('subtotal').get(function() {
  return this.quantity * this.price;
});

// Main Order schema
const OrderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [OrderItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total price cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'completed', 'cancelled'],
    default: 'pending'
  },
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'cash'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveryInstructions: {
    type: String,
    trim: true
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate product and restaurant details when needed
OrderSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'items.product',
    select: 'name slug price category'
  }).populate({
    path: 'restaurant',
    select: 'name slug address'
  });
  next();
});

// Calculate total price before saving
OrderSchema.pre('save', function(next) {
  if (!this.isModified('items')) return next();
  
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  next();
});

// Instance method to update order status
OrderSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  if (newStatus === 'completed') {
    this.actualDeliveryTime = new Date();
  }
  return this.save();
};

// Instance method to cancel order
OrderSchema.methods.cancelOrder = async function(reason) {
  if (this.status === 'completed' || this.status === 'delivering') {
    throw new Error('Cannot cancel order in current status');
  }
  
  this.status = 'cancelled';
  return this.save();
};

// Static method to find orders by user
OrderSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

// Static method to find orders by restaurant
OrderSchema.statics.findByRestaurant = function(restaurantId) {
  return this.find({ restaurant: restaurantId }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Order', OrderSchema);
