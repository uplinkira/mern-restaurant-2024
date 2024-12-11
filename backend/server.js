// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// Middleware for CORS
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? [process.env.FRONTEND_URL || 'https://your-production-domain.com']
      : ['http://localhost:3001', 'http://localhost:5001'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Compression middleware
app.use(compression());

// Middleware for logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  // Add detailed request logging
  app.use((req, res, next) => {
    console.log('Incoming request:', {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: {
        'content-type': req.headers['content-type'],
        'authorization': req.headers['authorization'] ? 'Bearer [REDACTED]' : 'None'
      }
    });
    next();
  });
}

// Middleware for parsing JSON and URL-encoded data
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Retrying connection...');
  setTimeout(connectDB, 5000);
});

connectDB();

// Dynamically load all routes with logging
const routeFiles = fs
  .readdirSync(path.join(__dirname, 'routes'))
  .filter((file) => file.endsWith('.js'));

routeFiles.forEach((routeFile) => {
  const routePath = `./routes/${routeFile}`;
  const routeName = routeFile.replace('.js', '');
  const apiPath = `/api/${routeName}`;
  console.log(`Loading route: ${apiPath} from ${routePath}`);
  app.use(apiPath, require(routePath));
  console.log(`Route loaded: ${apiPath}`);
});

// Add catch-all route handler for debugging
app.use((req, res, next) => {
  console.log('No route matched for:', {
    method: req.method,
    path: req.path,
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve React build files in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../client/build');
  console.log(`Serving static files from: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // Catch-all handler for serving React's index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  console.log('Running in development mode');
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', {
    error: err,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.errors
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'Invalid Data Format',
      message: 'Invalid data format or ID'
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate Key Error',
        message: 'A record with this key already exists'
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred with the database'
    });
  }

  // Handle custom errors
  if (err.status) {
    return res.status(err.status).json({
      success: false,
      error: err.name || 'Error',
      message: err.message
    });
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Received shutdown signal...');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = app;
