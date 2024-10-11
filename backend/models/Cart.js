const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish', required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [cartItemSchema],
  totalPrice: { type: Number, default: 0 },
});

// Middleware to calculate total price
cartSchema.pre('save', async function (next) {
  const cart = this;
  await cart.populate('items.product').execPopulate(); // Populate product data
  cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.quantity * item.product.price;
  }, 0);
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
