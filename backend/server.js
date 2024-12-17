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
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://accounts.google.com"],
      frameSrc: ["'self'", "https://accounts.google.com"],
      fontSrc: ["'self'", "data:", "https:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["blob:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Middleware for CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true, // 返回 `RateLimit-*` 头部信息
  legacyHeaders: false, // 禁用 `X-RateLimit-*` 头部信息
});

// 只对 API 路由应用限制
app.use('/api/', limiter);

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

// 在 connectDB() 之前添加环境变量日志
console.log('Starting server with environment:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Not set',
  PORT: process.env.PORT,
  FRONTEND_URL: process.env.FRONTEND_URL
});

// 修改 MongoDB 连接函数
const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB with URI:', 
      process.env.MONGODB_URI.replace(/:[^:]*@/, ':****@')  // 隐藏密码
    );
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', {
      message: error.message,
      code: error.code,
      name: error.name
    });
    process.exit(1);
  }
};

// 添加数据库事件监听
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

connectDB();

// 统一路由处理
const routeFiles = fs
  .readdirSync(path.join(__dirname, 'routes'))
  .filter((file) => file.endsWith('.js'));

// 1. 先注册 API 路由（只注册一次）
routeFiles.forEach((routeFile) => {
  const routePath = `./routes/${routeFile}`;
  const routeName = routeFile.replace('.js', '');
  const apiPath = `/api/${routeName}`;
  console.log(`Loading route: ${apiPath} from ${routePath}`);
  app.use(apiPath, require(routePath));
});

// 2. 生产环境处理
if (process.env.NODE_ENV === 'production') {
  console.log('Running in production mode');
  const clientBuildPath = path.join(__dirname, '../client/build');
  console.log('Serving static files from:', clientBuildPath);

  // 静态文件服务
  app.use(express.static(clientBuildPath));
  
  // 所有非 API 请求返回 index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    console.log('Serving index.html for path:', req.path);
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', {
    path: req.path,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 5001;
const server = app.listen(PORT, '0.0.0.0', () => {
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
