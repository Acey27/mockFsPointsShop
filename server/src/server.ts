import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import database helpers
import { isDatabaseAvailable } from './db/connection.js';
import { requireDatabase, optionalDatabase } from './middleware/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import pointsRoutes from './routes/points.js';
import shopRoutes from './routes/shop.js';
import usersRoutes from './routes/users.js';
import moodRoutes from './routes/mood.js';
import demoRoutes from './routes/demo.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env['PORT'] || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = [
  process.env['FRONTEND_URL'] || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging
app.use(morgan(process.env['NODE_ENV'] === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (_req, res) => {
  res.json({ 
    message: 'Points Shop API Server', 
    version: '1.0.0',
    status: 'running',
    database: isDatabaseAvailable() ? 'connected' : 'not available',
    timestamp: new Date().toISOString(),
    endpoints: {
      demo: '/api/demo',
      auth: '/api/auth',
      points: '/api/points', 
      shop: '/api/shop',
      users: '/api/users',
      mood: '/api/mood'
    },
    demoEndpoints: isDatabaseAvailable() ? null : {
      status: '/api/demo/status',
      sampleUser: '/api/demo/sample-user',
      sampleProducts: '/api/demo/sample-products'
    }
  });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'healthy', 
    database: isDatabaseAvailable() ? 'connected' : 'not available',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Demo routes (work without database)
app.use('/api/demo', demoRoutes);

// API routes (require database)
app.use('/api/auth', requireDatabase, authRoutes);
app.use('/api/points', requireDatabase, pointsRoutes);
app.use('/api/shop', requireDatabase, shopRoutes);
app.use('/api/users', requireDatabase, usersRoutes);
app.use('/api/mood', requireDatabase, moodRoutes);
app.use('/api/demo', requireDatabase, demoRoutes);

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  
  return res.status(500).json({ 
    error: process.env['NODE_ENV'] === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env['NODE_ENV'] || 'development'}`);
  console.log(`🌐 CORS enabled for: ${process.env['FRONTEND_URL'] || 'http://localhost:5173'}`);
  
  if (process.env['NODE_ENV'] !== 'production') {
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
