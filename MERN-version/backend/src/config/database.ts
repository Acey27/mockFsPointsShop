import mongoose from 'mongoose';
import { config } from './index.js';

class Database {
  private static instance: Database;
  public isConnected: boolean = false;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
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

  public async disconnect(): Promise<void> {
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

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  public async healthCheck(): Promise<{ status: string; message: string; details?: any }> {
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
