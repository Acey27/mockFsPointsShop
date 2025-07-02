import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors'; // Automatically catches async errors

import { config } from './config/index.js';
import { database } from './config/database.js';
import { globalErrorHandler, notFoundHandler, rateLimitHandler } from './middleware/errorHandler.js';
import { optionalDatabase } from './middleware/auth.js';
import { pointsScheduler } from './services/pointsScheduler.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import pointsRoutes from './routes/points.js';
import shopRoutes from './routes/shop.js';
import moodRoutes from './routes/mood.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Trust proxy if behind reverse proxy (for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (config.CORS_ORIGIN.includes(origin) || config.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: config.CORS_CREDENTIALS,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: rateLimitHandler,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and certain endpoints
    return req.path === '/health' || req.path === '/api/health';
  }
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.isDevelopment) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoints
app.get('/health', optionalDatabase, async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV,
    database: 'disconnected'
  };

  try {
    const dbHealth = await database.healthCheck();
    healthCheck.database = dbHealth.status;
    
    if (dbHealth.status === 'connected') {
      res.status(200).json(healthCheck);
    } else {
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    healthCheck.database = 'error';
    res.status(503).json(healthCheck);
  }
});

app.get('/api/health', optionalDatabase, async (req, res) => {
  const healthCheck = {
    api: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.NODE_ENV,
    database: 'disconnected',
    features: {
      authentication: true,
      pointsSystem: true,
      shop: true,
      moodTracking: true,
      adminPanel: true
    }
  };

  try {
    const dbHealth = await database.healthCheck();
    healthCheck.database = dbHealth.status;
    
    if (dbHealth.status === 'connected') {
      res.status(200).json(healthCheck);
    } else {
      res.status(503).json(healthCheck);
    }
  } catch (error) {
    healthCheck.database = 'error';
    res.status(503).json(healthCheck);
  }
});

// Demo/fallback endpoints (when database is not available)
app.get('/api/demo/users', (req, res) => {
  const mockUsers = [
    { id: "1", name: "Zeann Palma", department: "Engineering", avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40" },
    { id: "2", name: "Francis Jelo", department: "Design", avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40" },
    { id: "3", name: "Jasfer DelaCruz", department: "Marketing", avatar: "https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=40" },
    { id: "4", name: "Czar Reenjit", department: "Sales", avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=40" },
    { id: "5", name: "John Smith", department: "HR", avatar: "https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=40" }
  ];
  
  res.json({
    status: 'success',
    data: mockUsers,
    message: 'Demo data - database not connected'
  });
});

app.get('/api/demo/products', (req, res) => {
  const mockProducts = [
    {
      id: "1",
      name: "Company T-Shirt",
      description: "Premium cotton t-shirt with company logo",
      image: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
      pointsCost: 150,
      category: "apparel",
      inventory: 25,
      rating: 4.5,
    },
    {
      id: "2",
      name: "Coffee Mug",
      description: "Ceramic mug perfect for your morning coffee",
      image: "https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg?auto=compress&cs=tinysrgb&w=400",
      pointsCost: 75,
      category: "accessories",
      inventory: 50,
      rating: 4.8,
    },
    {
      id: "3",
      name: "Wireless Earbuds",
      description: "High-quality bluetooth earbuds",
      image: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400",
      pointsCost: 500,
      category: "electronics",
      inventory: 10,
      rating: 4.7,
    }
  ];
  
  res.json({
    status: 'success',
    data: mockProducts,
    message: 'Demo data - database not connected'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/admin', adminRoutes);

// API documentation (if enabled)
if (config.ENABLE_SWAGGER) {
  // We'll add Swagger setup here later
  app.get('/api-docs', (req, res) => {
    res.json({
      message: 'API Documentation',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        users: '/api/users',
        points: '/api/points',
        shop: '/api/shop',
        mood: '/api/mood',
        admin: '/api/admin'
      }
    });
  });
}

// Catch-all for undefined routes
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(globalErrorHandler);

// Start server function
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    console.log('✅ Database connected successfully');

    // Start the server
    const PORT = config.PORT;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📚 API documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      
      // Start the automatic points scheduler after server is ready
      console.log('⏰ Starting automatic points scheduler...');
      pointsScheduler.start();
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
      
      // Stop the points scheduler first
      console.log('⏹️ Stopping points scheduler...');
      pointsScheduler.stop();
      
      server.close(async () => {
        console.log('📡 HTTP server closed');
        
        try {
          await database.disconnect();
          console.log('🗃️  Database connection closed');
          process.exit(0);
        } catch (error) {
          console.error('❌ Error during database disconnect:', error);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    // Start server in fallback mode (without database)
    const PORT = config.PORT;
    app.listen(PORT, () => {
      console.log(`⚠️  Server running in FALLBACK mode on port ${PORT}`);
      console.log(`🔍 Database not available - using demo endpoints`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
    });
  }
};

// Start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default app;
