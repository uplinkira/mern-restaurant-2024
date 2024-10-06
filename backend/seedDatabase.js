const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');
const MenuCategory = require('./models/MenuCategory');
const Dish = require('./models/Dish');
const Product = require('./models/Product');
const Reservation = require('./models/Reservation');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');

    // Drop existing text index
    try {
      await mongoose.connection.collection('restaurants').dropIndex("name_text_description_text_cuisine_text");
      console.log('Existing text index dropped');
    } catch (error) {
      console.log('No existing text index to drop or error dropping index:', error.message);
    }

    // Ensure indexes
    await Promise.all([
      Restaurant.ensureIndexes(),
      Dish.ensureIndexes()
    ]);
    console.log('Indexes have been created');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

const readJsonFile = async (filename) => {
  const filePath = path.join(__dirname, 'data', filename);
  const data = await fs.readFile(filePath, 'utf8');
  return JSON.parse(data);
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      Restaurant.deleteMany({}),
      MenuCategory.deleteMany({}),
      Dish.deleteMany({}),
      Product.deleteMany({}),
      Reservation.deleteMany({})
    ]);
    console.log('Existing data cleared');

    // Read JSON files
    const [restaurantsData, menuCategoriesData, dishesData, productsData, reservationsData] = await Promise.all([
      readJsonFile('restaurants.json'),
      readJsonFile('menu-categories.json'),
      readJsonFile('dishes.json'),
      readJsonFile('products.json'),
      readJsonFile('reservations.json')
    ]);
    console.log('JSON files read successfully');

    // Insert restaurants
    const insertedRestaurants = await Restaurant.insertMany(restaurantsData);
    const restaurantMap = new Map(insertedRestaurants.map((r, index) => [index + 1, r._id]));
    console.log('Restaurants inserted successfully');

    // Insert menu categories
    const updatedMenuCategories = menuCategoriesData.map(category => ({
      ...category,
      restaurants: category.restaurants.map(id => restaurantMap.get(id))
    }));
    const insertedCategories = await MenuCategory.insertMany(updatedMenuCategories);
    const categoryMap = new Map(insertedCategories.map((c, index) => [index + 1, c._id]));
    console.log('Menu categories inserted successfully');

    // Insert dishes
    const dishPromises = dishesData.flatMap(dish => {
      const restaurants = Array.isArray(dish.restaurant) ? dish.restaurant : [dish.restaurant];
      return restaurants.map(async (restaurantId) => {
        console.log(`Processing dish: ${dish.name}`);
        console.log(`Restaurant ID: ${restaurantId}, Mapped ID: ${restaurantMap.get(restaurantId)}`);
        console.log(`Menu Category: ${dish.menuCategory}, Mapped Category: ${categoryMap.get(dish.menuCategory)}`);
        
        const newDish = new Dish({
          ...dish,
          restaurant: restaurantMap.get(restaurantId),
          menuCategory: categoryMap.get(dish.menuCategory)
        });
        const savedDish = await newDish.save();
        await Restaurant.findByIdAndUpdate(
          restaurantMap.get(restaurantId),
          { $push: { dishes: savedDish._id } }
        );
        return savedDish;
      });
    });
    const insertedDishes = await Promise.all(dishPromises);
    console.log('Dishes inserted successfully');

    // Create a map of old dish ID to new dish ID
    const dishMap = new Map(insertedDishes.map((dish, index) => [index + 1, dish._id]));

    // Insert products (no restaurant association)
    await Product.insertMany(productsData);
    console.log('Products inserted successfully');

    // Insert reservations
    const updatedReservations = reservationsData.map(reservation => ({
      ...reservation,
      restaurant: restaurantMap.get(reservation.restaurant),
      reservedDishes: reservation.reservedDishes.map(dish => ({
        dishId: dishMap.get(dish.dishId),
        quantity: dish.quantity
      }))
    }));
    await Reservation.insertMany(updatedReservations);
    console.log('Reservations inserted successfully');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    if (error.errors) {
      Object.keys(error.errors).forEach(key => {
        console.error(`Validation error for ${key}:`, error.errors[key].message);
      });
    }
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
};

seedDatabase();