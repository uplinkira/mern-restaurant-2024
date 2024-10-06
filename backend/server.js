const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // replace with your frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('MongoDB connected...');
  console.log('MongoDB URI:', process.env.MONGODB_URI);
  
  // Drop existing email index
  try {
    await mongoose.connection.collection('restaurants').dropIndex("email_1");
    console.log('Existing email index dropped');
  } catch (error) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }

  // Ensure indexes
  return Promise.all([
    mongoose.model('Restaurant').ensureIndexes(),
    mongoose.model('Dish').ensureIndexes()
  ]);
})
.then(() => console.log('Indexes have been created'))
.catch(err => console.log('MongoDB connection error:', err));

// Routes
const restaurantRoutes = require('./routes/restaurants');
const authRoutes = require('./routes/auth');

app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', err);
  console.error('Error stack:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const dishRoutes = require('./routes/dishes');  // Add this line to import dish routes

// Existing routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dishes', dishRoutes);  // Add this line to use dish routes
