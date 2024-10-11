const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Enhanced CORS Configuration
const allowedOrigins = ['http://localhost:3000', 'https://your-production-domain.com'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Ensure OPTIONS method is allowed for preflight requests
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,  // Allow cookies to be sent with requests
  optionsSuccessStatus: 200  // Some older browsers choke on 204 responses
};

app.use(cors(corsOptions));
app.use(express.json());  // Parse incoming JSON requests

// MongoDB Connection with retry logic and improved logging
const connectWithRetry = () => {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,  // 5 seconds timeout for connection
  })
  .then(() => console.log('MongoDB connected successfully...'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectWithRetry, 5000);  // Retry connection after 5 seconds
  });
};

connectWithRetry();

// Routes
const restaurantRoutes = require('./routes/restaurants');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const dishRoutes = require('./routes/dishes');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const productRoutes = require('./routes/products');

// Register Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/products', productRoutes);

// Error Handling Middleware - improved for specific errors
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (res.headersSent) {
    return next(err);
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  } else if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ message: 'CORS error: ' + err.message });
  }
  res.status(500).json({ message: 'An internal server error occurred', error: err.message });
});

// Graceful shutdown handling
const server = app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Handle SIGTERM signal for graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(() => {
      console.log('MongoDB connection closed');
    });
  });
});

module.exports = app;
