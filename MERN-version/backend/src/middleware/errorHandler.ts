import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  error: string;
  message: string;
  stack?: string;
  details?: any;
}

// Validation error handler
export const handleValidationError = (error: any): AppError => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => err.message);
    const message = `Validation Error: ${errors.join(', ')}`;
    return new AppError(message, 400);
  }
  return error;
};

// MongoDB duplicate key error handler
export const handleDuplicateKeyError = (error: any): AppError => {
  if (error.code === 11000 && error.keyValue) {
    const field = Object.keys(error.keyValue)[0];
    const value = field ? error.keyValue[field] : 'unknown';
    const message = `Duplicate value for field '${field}': ${value}. Please use a different value.`;
    return new AppError(message, 400);
  }
  return error;
};

// MongoDB cast error handler
export const handleCastError = (error: any): AppError => {
  if (error.name === 'CastError') {
    const message = `Invalid value for ${error.path}: ${error.value}`;
    return new AppError(message, 400);
  }
  return error;
};

// JWT error handler
export const handleJWTError = (error: any): AppError => {
  if (error.name === 'JsonWebTokenError') {
    return new AppError('Invalid token. Please log in again.', 401);
  }
  if (error.name === 'TokenExpiredError') {
    return new AppError('Token expired. Please log in again.', 401);
  }
  return error;
};

// Send error response in development
const sendErrorDev = (err: AppError, res: Response) => {
  const response: ErrorResponse = {
    error: err.name || 'Error',
    message: err.message,
    stack: err.stack,
    details: err
  };

  res.status(err.statusCode || 500).json(response);
};

// Send error response in production
const sendErrorProd = (err: AppError, res: Response) => {
  // Operational errors: send to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      error: 'Error',
      message: err.message
    };
    res.status(err.statusCode).json(response);
  } else {
    // Programming errors: don't leak details to client
    console.error('ERROR:', err);
    
    const response: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Something went wrong on our end. Please try again later.'
    };
    
    res.status(500).json(response);
  }
};

// Global error handling middleware
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Global Error Handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId || 'anonymous'
  });

  // Handle specific error types
  error = handleValidationError(error);
  error = handleDuplicateKeyError(error);
  error = handleCastError(error);
  error = handleJWTError(error);

  // Send error response
  if (config.isDevelopment) {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

// Rate limit error handler
export const rateLimitHandler = (req: Request, res: Response) => {
  res.status(429).json({
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  });
};

// Database connection error handler
export const databaseErrorHandler = (error: any) => {
  console.error('Database Error:', error);
  
  if (error.name === 'MongoNetworkError') {
    return new AppError('Database connection failed', 503);
  }
  
  if (error.name === 'MongoTimeoutError') {
    return new AppError('Database request timeout', 503);
  }
  
  return new AppError('Database error occurred', 500);
};

// Validation middleware using Joi
export const validateRequest = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map((detail: any) => detail.message).join(', ');
      return next(new AppError(`Validation Error: ${errorMessage}`, 400));
    }

    next();
  };
};

// CORS error handler
export const corsErrorHandler = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  
  if (!origin || !config.CORS_ORIGIN.includes(origin)) {
    return next(new AppError('CORS policy violation', 403));
  }
  
  next();
};
