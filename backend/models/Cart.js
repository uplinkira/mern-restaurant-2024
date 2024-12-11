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
  items: [CartItemSchema],
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
    
    // Ensure all items have valid products
    for (const item of this.items) {
      if (!item.product) {
        const product = await mongoose.model('Product').findById(item.productId);
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
        item.product = product._id;
        item.price = product.price;
      }
    }
    
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
      // Create a new cart if one doesn't exist
      cart = await this.create({
        user: userId,
        items: [],
        totalPrice: 0
      });
    }

    // Ensure product details are populated
    await cart.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    return cart;
  } catch (error) {
    console.error('Error in findByUser:', error);
    throw error;
  }
};

// Instance method to add product to cart
CartSchema.methods.addProduct = async function(productId, quantity = 1) {
  try {
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

    const existingItem = this.items.find(item => 
      item.product.toString() === productId.toString()
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = product.price;
    } else {
      this.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    }

    await this.save();
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
      return await this.removeProduct(productId);
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

    // Find the item index
    const itemIndex = this.items.findIndex(item => 
      item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      // If item doesn't exist, add it
      this.items.push({
        product: productId,
        quantity,
        price: product.price
      });
    } else {
      // Update existing item
      this.items[itemIndex].quantity = quantity;
      this.items[itemIndex].price = product.price;
    }

    console.log('Saving cart with updated quantity:', {
      productId,
      quantity,
      price: product.price,
      itemsCount: this.items.length
    });

    await this.save();
    
    // Populate product details after save
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    console.log('Cart saved successfully:', {
      cartId: this._id,
      itemCount: this.items.length,
      totalPrice: this.totalPrice
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
      userId: this.user,
      currentItems: this.items.length
    });

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }

    // Find the item index
    const itemIndex = this.items.findIndex(item => 
      item.product.toString() === productId.toString()
    );

    if (itemIndex === -1) {
      throw new Error('Product not found in cart');
    }

    // Remove the item
    this.items.splice(itemIndex, 1);

    console.log('Saving cart after removing product:', {
      removedProductId: productId,
      remainingItems: this.items.length
    });

    await this.save();

    // Populate product details after save
    await this.populate({
      path: 'items.product',
      select: 'name slug price stockStatus availableForDelivery category allergens'
    });

    console.log('Cart saved successfully:', {
      cartId: this._id,
      itemCount: this.items.length,
      totalPrice: this.totalPrice
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
    console.error('Error in clearCart:', error);
    throw error;
  }
};

// Instance method to check delivery availability
CartSchema.methods.checkDeliveryAvailability = async function() {
  try {
    const unavailableItems = [];
    
    for (const item of this.items) {
      const product = await mongoose.model('Product').findById(item.product);
      if (!product) {
        unavailableItems.push({
          productId: item.product,
          reason: 'Product not found'
        });
        continue;
      }

      if (product.stockStatus === 'out_of_stock') {
        unavailableItems.push({
          productId: item.product,
          name: product.name,
          reason: 'Out of stock'
        });
      }

      if (!product.availableForDelivery) {
        unavailableItems.push({
          productId: item.product,
          name: product.name,
          reason: 'Not available for delivery'
        });
      }
    }

    return {
      isDeliverable: unavailableItems.length === 0,
      unavailableItems
    };
  } catch (error) {
    console.error('Error in checkDeliveryAvailability:', error);
    throw error;
  }
};

module.exports = mongoose.model('Cart', CartSchema);
