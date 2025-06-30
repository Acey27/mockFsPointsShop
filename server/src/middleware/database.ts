import { Request, Response, NextFunction } from 'express';
import { isDatabaseAvailable } from '../db/connection.js';

// Middleware to check database availability
export const requireDatabase = (_req: Request, res: Response, next: NextFunction) => {
  if (!isDatabaseAvailable()) {
    return res.status(503).json({ 
      error: 'Database not available', 
      message: 'This feature requires a database connection. Please set up PostgreSQL and restart the server.',
      setup: {
        docker: 'docker-compose up -d',
        manual: 'createdb points_shop && npm run db:migrate && npm run db:seed'
      }
    });
  }
  return next();
};

// Optional database middleware - continues even if database is not available
export const optionalDatabase = (req: Request, _res: Response, next: NextFunction) => {
  if (!isDatabaseAvailable()) {
    console.warn('⚠️  Database not available for request:', req.method, req.path);
  }
  return next();
};
