const mongoose = require('mongoose');
require('dotenv').config();

const Restaurant = require('./models/Restaurant');
const Menu = require('./models/Menu');
const Dish = require('./models/Dish');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const Reservation = require('./models/Reservation');
const authController = require('./controllers/authController'); // Import authController

const restaurantsData = require('./data/restaurants.json');
const menusData = require('./data/menus.json');
const dishesData = require('./data/dishes.json');
const productsData = require('./data/products.json');
const usersData = require('./data/users.json');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set('strictQuery', false);

const seedDatabase = async () => {
  try {
    // Clear existing data
    await Promise.all([
      Restaurant.deleteMany({}),
      Menu.deleteMany({}),
      Dish.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
      Cart.deleteMany({}),
      Reservation.deleteMany({}),
    ]);
    console.log('Existing data cleared');

    // Seed Restaurants
    const restaurantDocs = await Restaurant.insertMany(restaurantsData);
    console.log('Restaurants seeded');

    // Create restaurant map
    const restaurantMap = new Map(restaurantDocs.map((r) => [r.name, r._id]));

    // Seed Menus
    const menusPromises = menusData.map((menu) => {
      const restaurantIds = menu.restaurants.map((name) => restaurantMap.get(name));
      return new Menu({ ...menu, restaurants: restaurantIds }).save();
    });
    const menuDocs = await Promise.all(menusPromises);
    console.log('Menus seeded');

    // Create menu map
    const menuMap = new Map(menuDocs.map((m) => [m.name, m._id]));

    // Seed Dishes
    const dishesPromises = dishesData.map((dish) => {
      const restaurantIds = dish.restaurants.map((name) => restaurantMap.get(name));
      const menuIds = dish.menus.map((name) => menuMap.get(name));
      return new Dish({ ...dish, restaurants: restaurantIds, menus: menuIds }).save();
    });
    await Promise.all(dishesPromises);
    console.log('Dishes seeded');

    // Seed Products
    await Product.insertMany(productsData);
    console.log('Products seeded');

    // Seed Users using the authController.register function
    for (const userData of usersData) {
      try {
        const mockReq = {
          body: {
            email: userData.email,
            password: userData.password || 'DefaultPassword123!',
            firstName: userData.firstName,
            lastName: userData.lastName,
            phoneNumber: userData.phoneNumber,
            username: userData.username,
          },
        };

        const mockRes = {
          status: function (statusCode) {
            this.statusCode = statusCode;
            return this;
          },
          json: function (data) {
            console.log(`User registered: ${data.user.email}`);
            return Promise.resolve(); // Ensure async response
          },
        };

        // Call the register function
        await authController.register(mockReq, mockRes);
      } catch (error) {
        console.error(`Error registering user ${userData.email}:`, error.message);
      }
    }
    console.log('Users seeded successfully');

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    mongoose.disconnect();
  }
};

seedDatabase();
