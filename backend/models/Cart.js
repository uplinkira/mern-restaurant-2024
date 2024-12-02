const mongoose = require('mongoose');

// Define schema for items in the cart
const CartItemSchema = new mongoose.Schema({
  product: {
    type: String, // Use slug reference for consistency with Product model
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

// Define the main Cart schema
const CartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [CartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field to populate product details for each cart item
CartSchema.virtual('itemDetails', {
  ref: 'Product',
  localField: 'items.product',
  foreignField: 'slug', // Match the slug field in Product model
  justOne: false,
});

// Method to calculate the total price of the cart
CartSchema.methods.calculateTotalPrice = function () {
  this.totalPrice = this.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  return this.save();
};

// Method to add a product to the cart
CartSchema.methods.addProduct = async function (productSlug, quantity) {
  const product = await mongoose.model('Product').findOne({ slug: productSlug });
  if (!product) {
    throw new Error('Product not found');
  }

  const existingItem = this.items.find((item) => item.product === productSlug);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({
      product: productSlug,
      quantity,
      price: product.price,
    });
  }

  return this.calculateTotalPrice();
};

// Method to remove a product from the cart
CartSchema.methods.removeProduct = function (productSlug) {
  this.items = this.items.filter((item) => item.product !== productSlug);
  return this.calculateTotalPrice();
};

// Method to update product quantity in the cart
CartSchema.methods.updateProductQuantity = function (productSlug, quantity) {
  const item = this.items.find((item) => item.product === productSlug);
  if (item) {
    if (quantity <= 0) {
      return this.removeProduct(productSlug);
    }
    item.quantity = quantity;
    return this.calculateTotalPrice();
  }
  throw new Error('Product not found in cart');
};

// Method to clear the cart
CartSchema.methods.clearCart = function () {
  this.items = [];
  this.totalPrice = 0;
  return this.save();
};

// Method to check delivery availability for products in the cart
CartSchema.methods.checkDeliveryAvailability = async function () {
  const unavailableItems = [];
  for (const item of this.items) {
    const product = await mongoose.model('Product').findOne({ slug: item.product });
    if (product && !product.availableForDelivery) {
      unavailableItems.push(product.name);
    }
  }
  return unavailableItems;
};

// Middleware to update the `updatedAt` field whenever the cart is modified
CartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Middleware to validate items before saving
CartSchema.pre('save', async function (next) {
  for (const item of this.items) {
    const product = await mongoose.model('Product').findOne({ slug: item.product });
    if (!product) {
      return next(new Error(`Product with slug "${item.product}" not found`));
    }
    if (product.price !== item.price) {
      item.price = product.price; // Update the price to match the latest price from Product model
    }
  }
  next();
});

// Static method to find a cart by user ID
CartSchema.statics.findByUser = function (userId) {
  return this.findOne({ user: userId }).populate('itemDetails');
};

// Export the Cart model
module.exports = mongoose.model('Cart', CartSchema);
