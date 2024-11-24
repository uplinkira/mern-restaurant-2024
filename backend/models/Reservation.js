const mongoose = require('mongoose');

const ReservedDishSchema = new mongoose.Schema({
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
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

const ReservationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  menu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Menu'
  },
  dishes: [ReservedDishSchema],
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  numberOfGuests: {
    type: Number,
    required: true,
    min: 1
  },
  specialRequests: String,
  totalPrice: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
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

// 计算预订总价的方法
ReservationSchema.methods.calculateTotalPrice = function() {
  this.totalPrice = this.dishes.reduce((total, item) => total + (item.price * item.quantity), 0);
  return this.save();
};

// 添加菜品到预订的方法
ReservationSchema.methods.addDish = async function(dishId, quantity) {
  const dish = await mongoose.model('Dish').findById(dishId);
  if (!dish) {
    throw new Error('Dish not found');
  }

  const existingItem = this.dishes.find(item => item.dish.toString() === dishId.toString());
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.dishes.push({
      dish: dishId,
      quantity: quantity,
      price: dish.price
    });
  }

  this.updatedAt = new Date();
  return this.calculateTotalPrice();
};

// 从预订中移除菜品的方法
ReservationSchema.methods.removeDish = function(dishId) {
  this.dishes = this.dishes.filter(item => item.dish.toString() !== dishId.toString());
  this.updatedAt = new Date();
  return this.calculateTotalPrice();
};

// 更新预订中菜品数量的方法
ReservationSchema.methods.updateDishQuantity = function(dishId, quantity) {
  const item = this.dishes.find(item => item.dish.toString() === dishId.toString());
  if (item) {
    item.quantity = quantity;
    this.updatedAt = new Date();
    return this.calculateTotalPrice();
  }
  throw new Error('Dish not found in reservation');
};

// 检查预订可用性的方法
ReservationSchema.statics.checkAvailability = async function(restaurantId, date, time, numberOfGuests) {
  const restaurant = await mongoose.model('Restaurant').findById(restaurantId);
  if (!restaurant) {
    throw new Error('Restaurant not found');
  }

  // 检查餐厅是否在指定时间开放
  // 这里需要根据您的具体需求实现逻辑

  // 检查是否有足够的座位
  const existingReservations = await this.find({
    restaurant: restaurantId,
    date: date,
    time: time,
    status: 'confirmed'
  });

  const totalReservedSeats = existingReservations.reduce((total, reservation) => total + reservation.numberOfGuests, 0);

  if (totalReservedSeats + numberOfGuests > restaurant.maxCapacity) {
    return false;
  }

  return true;
};

// 确认预订的方法
ReservationSchema.methods.confirm = function() {
  this.status = 'confirmed';
  this.updatedAt = new Date();
  return this.save();
};

// 取消预订的方法
ReservationSchema.methods.cancel = function() {
  this.status = 'cancelled';
  this.updatedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Reservation', ReservationSchema);