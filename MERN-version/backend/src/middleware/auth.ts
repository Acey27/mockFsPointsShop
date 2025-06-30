import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User, IUser } from '../models/User.js';
import { database } from '../config/database.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      userId?: string;
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Middleware to check database availability
export const requireDatabase = (_req: Request, res: Response, next: NextFunction) => {
  if (!database.getConnectionStatus()) {
    return res.status(503).json({ 
      error: 'Database not available', 
      message: 'This feature requires a database connection. Please ensure MongoDB is running.',
      setup: {
        docker: 'docker-compose up -d',
        manual: 'Make sure MongoDB is running on your system'
      }
    });
  }
  return next();
};

// Optional database middleware - continues even if database is not available
export const optionalDatabase = (req: Request, _res: Response, next: NextFunction) => {
  if (!database.getConnectionStatus()) {
    console.warn('⚠️  Database not available for request:', req.method, req.path);
  }
  return next();
};

// JWT token verification middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    // Verify the token
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User not found' 
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'User account is inactive' 
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user._id.toString();
    
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Invalid token' 
      });
    }

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'Token expired' 
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Authentication failed' 
    });
  }
};

// Alias for common usage
export const requireAuth = authenticateToken;

// Optional authentication - doesn't fail if no token provided
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id.toString();
    }

    return next();
  } catch (error) {
    // Ignore authentication errors for optional auth
    return next();
  }
};

// Admin role authorization middleware
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Authentication required' 
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'Admin privileges required' 
    });
  }

  return next();
};

// User role authorization middleware (user or admin)
export const requireUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Authentication required' 
    });
  }

  if (!['user', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'User privileges required' 
    });
  }

  return next();
};

// Check if user owns resource or is admin
export const requireOwnershipOrAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Access denied', 
      message: 'Authentication required' 
    });
  }

  const resourceUserId = req.params.userId || req.body.userId;
  const isOwner = req.user._id.toString() === resourceUserId;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ 
      error: 'Access denied', 
      message: 'You can only access your own resources' 
    });
  }

  return next();
};

// Helper function to validate MongoDB ObjectId
export const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Generate JWT token
export const generateToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const jwtSecret = config.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(payload, jwtSecret, {
    expiresIn: config.JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

// Generate refresh token
export const generateRefreshToken = (user: IUser): string => {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  };

  const refreshSecret = config.REFRESH_TOKEN_SECRET;
  if (!refreshSecret) {
    throw new Error('REFRESH_TOKEN_SECRET is not configured');
  }

  return jwt.sign(payload, refreshSecret, {
    expiresIn: config.REFRESH_TOKEN_EXPIRES_IN
  } as jwt.SignOptions);
};

// Verify refresh token
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, config.REFRESH_TOKEN_SECRET) as JWTPayload;
};
