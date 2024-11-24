const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [CartItemSchema],
  totalPrice: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method to calculate total price of the cart
CartSchema.methods.calculateTotalPrice = function() {
  this.totalPrice = this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  return this.save();
};

// Method to add a product to the cart
CartSchema.methods.addProduct = async function(productId, quantity) {
  const product = await mongoose.model('Product').findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const existingItem = this.items.find(item => item.product.toString() === productId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productId,
      quantity: quantity,
      price: product.price
    });
  }

  this.updatedAt = new Date();
  return this.calculateTotalPrice();
};

// Method to remove a product from the cart
CartSchema.methods.removeProduct = function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  this.updatedAt = new Date();
  return this.calculateTotalPrice();
};

// Method to update product quantity in the cart
CartSchema.methods.updateProductQuantity = function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  if (item) {
    item.quantity = quantity;
    this.updatedAt = new Date();
    return this.calculateTotalPrice();
  }
  throw new Error('Product not found in cart');
};

// Method to clear the cart
CartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalPrice = 0;
  this.updatedAt = new Date();
  return this.save();
};

// Method to check delivery availability for products in the cart
CartSchema.methods.checkDeliveryAvailability = async function() {
  const unavailableItems = [];
  for (let item of this.items) {
    const product = await mongoose.model('Product').findById(item.product);
    if (product && !product.availableForDelivery) {
      unavailableItems.push(product.name);
    }
  }
  return unavailableItems;
};

module.exports = mongoose.model('Cart', CartSchema);
