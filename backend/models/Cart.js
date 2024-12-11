const mongoose = require('mongoose');

// Define schema for items in the cart
const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Quantity must be a whole number'
    }
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
CartItemSchema.virtual('subtotal').get(function() {
  return this.quantity * this.price;
});

// Main Cart schema
const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number'
      }
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative']
    }
  }],
  totalPrice: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Populate product details when needed
CartSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'items.product',
    select: 'name slug price stockStatus availableForDelivery category allergens'
  });
  next();
});

// Calculate total price before saving
CartSchema.pre('save', async function(next) {
  try {
    // Remove items with quantity 0
    this.items = this.items.filter(item => item.quantity > 0);
    
    // Calculate total price
    this.totalPrice = this.items.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find cart by user ID
CartSchema.statics.findByUser = async function(userId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    let cart = await this.findOne({ user: userId });
    if (!cart) {
      cart = await this.create({
        user: userId,
        items: [],
        totalPrice: 0
      });
    }

    return cart;
  } catch (error) {
    console.error('Error in findByUser:', error);
    throw error;
  }
};

// Instance method to add product to cart
CartSchema.methods.addProduct = async function(productId, quantity = 1) {
  try {
    console.log('Starting addProduct:', { 
      productId, 
      quantity,
      cartId: this._id,
      userId: this.user
    });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }

    const product = await mongoose.model('Product').findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stockStatus === 'out_of_stock') {
      throw new Error('Product is out of stock');
    }

    if (!product.availableForDelivery) {
      throw new Error('Product is not available for delivery');
    }

    // Find existing item index
    const existingItemIndex = this.items.findIndex(item => {
      const itemProductId = item.product._id || item.product;
      return itemProductId.toString() === productId.toString();
    });

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      this.items[existingItemIndex].quantity += quantity;
      this.items[existingItemIndex].price = product.price;
    } else {
      // Add new item
      this.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    console.log('Before save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));

    await this.save();

    console.log('After save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));

    // Populate product details after save
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    return this;
  } catch (error) {
    console.error('Error in addProduct:', error);
    throw error;
  }
};

// Instance method to update product quantity
CartSchema.methods.updateProductQuantity = async function(productId, quantity) {
  try {
    console.log('Starting updateProductQuantity:', { 
      productId, 
      quantity,
      cartId: this._id,
      userId: this.user
    });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }

    // If quantity is 0, remove the item
    if (quantity === 0) {
      this.items = this.items.filter(item => {
        const itemProductId = item.product._id || item.product;
        return itemProductId.toString() !== productId.toString();
      });
      await this.save();
      return this;
    }

    const product = await mongoose.model('Product').findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    if (product.stockStatus === 'out_of_stock') {
      throw new Error('Product is out of stock');
    }

    if (!product.availableForDelivery) {
      throw new Error('Product is not available for delivery');
    }

    // Find existing item index
    const existingItemIndex = this.items.findIndex(item => {
      const itemProductId = item.product._id || item.product;
      return itemProductId.toString() === productId.toString();
    });

    if (existingItemIndex === -1) {
      // Add new item
      this.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    } else {
      // Update existing item
      this.items[existingItemIndex].quantity = quantity;
      this.items[existingItemIndex].price = product.price;
    }

    console.log('Before save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));

    await this.save();

    console.log('After save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));
    
    // Populate product details after save
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    return this;
  } catch (error) {
    console.error('Error in updateProductQuantity:', error);
    throw error;
  }
};

// Instance method to remove product
CartSchema.methods.removeProduct = async function(productId) {
  try {
    console.log('Starting removeProduct:', { 
      productId,
      cartId: this._id,
      userId: this.user
    });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }

    // Remove the item
    this.items = this.items.filter(item => {
      const itemProductId = item.product._id || item.product;
      return itemProductId.toString() !== productId.toString();
    });

    console.log('Before save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));

    await this.save();

    console.log('After save - Cart items:', this.items.map(item => ({
      productId: (item.product._id || item.product).toString(),
      quantity: item.quantity,
      price: item.price
    })));

    // Populate product details after save
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    return this;
  } catch (error) {
    console.error('Error in removeProduct:', error);
    throw error;
  }
};

// Instance method to clear cart
CartSchema.methods.clearCart = async function() {
  try {
    this.items = [];
    this.totalPrice = 0;
    await this.save();
    return this;
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Instance method to check delivery availability
CartSchema.methods.checkDeliveryAvailability = async function() {
  try {
    console.log('Checking delivery availability for cart:', this._id);
    
    // Ensure items are populated
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery'
    });

    const unavailableItems = this.items.filter(item => {
      const product = item.product;
      return !product.availableForDelivery || product.stockStatus === 'out_of_stock';
    });

    console.log('Delivery availability check result:', {
      cartId: this._id,
      totalItems: this.items.length,
      unavailableItems: unavailableItems.length
    });

    return unavailableItems;
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    throw error;
  }
};

module.exports = mongoose.model('Cart', CartSchema);
