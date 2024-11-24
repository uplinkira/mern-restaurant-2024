const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const restaurantRoutes = require('./routes/restaurants');
const menuRoutes = require('./routes/menus');
const dishRoutes = require('./routes/dishes');
const productRoutes = require('./routes/products');
// const reservationRoutes = require('./routes/reservations'); // Commented out to skip reservations route
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');

// Initialize Express app
const app = express();

// Middleware for CORS
const allowedOrigins = ['http://localhost:3001', 'http://localhost:5001', 'https://your-production-domain.com'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allow all necessary methods
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 200, // Fallback status for legacy browsers
};
app.use(cors(corsOptions));

// Middleware for parsing JSON requests
app.use(express.json());

// MongoDB connection logic with retry and logging
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected...');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
connectDB(); // Call to initiate MongoDB connection

// Routes
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/products', productRoutes);
// app.use('/api/reservations', reservationRoutes); // Skipped reservation routes
app.use('/api/auth', authRoutes); // Authentication routes for registration and login
app.use('/api/profile', profileRoutes); // Profile routes for user management

// Serve static files (optional for frontend)
app.use(express.static(path.join(__dirname, 'public')));

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (res.headersSent) {
    return next(err);
  }
  if (err.message.includes('CORS')) {
    return res.status(403).json({ error: 'CORS Error: ' + err.message });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start the server with graceful shutdown logic
const server = app.listen(process.env.PORT || 5001, () => {
  console.log(`Server running on port ${process.env.PORT || 5001}`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
};

// Listen for termination signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
