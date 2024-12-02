const mongoose = require('mongoose');

// Define the Order schema
const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId, // User ID reference
      ref: 'User',
      required: true,
    },
    items: [
      {
        product: {
          type: String, // Use slug for Product reference
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number, // Quantity of the product
          required: true,
          min: 1,
        },
        price: {
          type: Number, // Price of the product at the time of order
          required: true,
          min: 0,
        },
      },
    ],
    totalAmount: {
      type: Number, // Total order amount
      required: true,
      min: 0,
    },
    status: {
      type: String, // Order status
      enum: ['Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    paymentDetails: {
      type: Map, // Payment information (e.g., payment ID, method)
      of: String,
      default: {},
    },
  },
  {
    timestamps: true, // Automatically generate createdAt and updatedAt fields
    toJSON: { virtuals: true }, // Include virtuals in JSON responses
    toObject: { virtuals: true },
  }
);

// Middleware to update `updatedAt` before saving
OrderSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to find orders by user
OrderSchema.statics.findByUser = function (userId) {
  return this.find({ user: userId }).populate('items.product', 'name price slug');
};

// Instance method to update order status
OrderSchema.methods.updateStatus = function (newStatus) {
  if (!['Pending', 'Paid', 'Shipped', 'Completed', 'Cancelled'].includes(newStatus)) {
    throw new Error('Invalid order status');
  }
  this.status = newStatus;
  return this.save();
};

// Instance method to calculate the total amount of the order
OrderSchema.methods.calculateTotalAmount = function () {
  this.totalAmount = this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  return this.save();
};

// Virtual to populate product details using slug
OrderSchema.virtual('productDetails', {
  ref: 'Product',
  localField: 'items.product',
  foreignField: 'slug',
  justOne: false,
});

// Export the Order model
module.exports = mongoose.model('Order', OrderSchema);
