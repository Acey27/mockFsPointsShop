import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'points-shop',
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  
  // Password Hashing
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  
  // CORS Configuration
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(origin => origin.trim()),
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === 'true',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Email Configuration
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@pointsshop.com',
  FROM_NAME: process.env.FROM_NAME || 'Points Shop',
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  
  // API Documentation
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true',
  SWAGGER_URL: process.env.SWAGGER_URL || '/api-docs',
  
  // Development flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
};

export default config;
