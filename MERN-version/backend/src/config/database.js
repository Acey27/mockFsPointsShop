import mongoose from 'mongoose';
import { config } from './index.js';

class Database {
  constructor() {
    this.isConnected = false;
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect() {
    try {
      if (this.isConnected) {
        console.log('✅ Database already connected');
        return;
      }

      // MongoDB connection options
      const options = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        authSource: 'admin'
      };

      const conn = await mongoose.connect(config.MONGODB_URI, options);
      
      this.isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

      // Connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      if (!this.isConnected) {
        return;
      }

      await mongoose.connection.close();
      this.isConnected = false;
      console.log('👋 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error disconnecting from database:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async healthCheck() {
    try {
      if (!this.isConnected) {
        return {
          status: 'disconnected',
          message: 'Database not connected'
        };
      }

      // Simple ping to check connection
      await mongoose.connection.db?.admin().ping();
      
      return {
        status: 'connected',
        message: 'Database connection healthy',
        details: {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          database: mongoose.connection.name,
          readyState: mongoose.connection.readyState
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Database health check failed',
        details: error
      };
    }
  }
}

export const database = Database.getInstance();
export default database;
