require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const MenuCategory = require('./models/MenuCategory');
const Dish = require('./models/Dish');
const Product = require('./models/Product');
const Reservation = require('./models/Reservation');

const restaurantsData = require('./data/restaurants.json');
const menuCategoriesData = require('./data/menu-categories.json');
const dishesData = require('./data/dishes.json');
const productsData = require('./data/products.json');
const reservationsData = require('./data/reservations.json');

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected for seeding...');

    // Clear existing data
    await Restaurant.deleteMany({});
    await MenuCategory.deleteMany({});
    await Dish.deleteMany({});
    await Product.deleteMany({});
    await Reservation.deleteMany({});

    // Seed Restaurants
    const restaurants = await Restaurant.insertMany(restaurantsData);

    // Seed Menu Categories
    const menuCategories = await MenuCategory.insertMany(
      menuCategoriesData.map(category => ({
        ...category,
        restaurants: category.restaurants.map(index => restaurants[index - 1]._id)
      }))
    );

    // Seed Dishes
    const dishes = await Dish.insertMany(
      dishesData.map(dish => ({
        ...dish,
        menuCategory: menuCategories[dish.menuCategory - 1]._id
      }))
    );

    // Seed Products
    await Product.insertMany(productsData);

    // Seed Reservations
    await Reservation.insertMany(
      reservationsData.map(reservation => ({
        ...reservation,
        restaurant: restaurants[reservation.restaurant - 1]._id,
        reservedDishes: reservation.reservedDishes.map(dish => ({
          dishId: dishes[dish.dishId - 1]._id,
          quantity: dish.quantity
        }))
      }))
    );

    console.log('Sample data inserted successfully');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error seeding data:', err);
    mongoose.connection.close();
  });
