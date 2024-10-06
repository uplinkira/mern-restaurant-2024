const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  time: { type: String, required: true },
  numberOfGuests: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  specialRequests: String,
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  reservedDishes: [{
    dishId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dish' },
    quantity: Number
  }],
  paymentStatus: { type: String, required: true },
  splitPayment: { type: Boolean, default: false }
});

module.exports = mongoose.model('Reservation', ReservationSchema);
