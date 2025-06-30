import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env['DATABASE_URL']!;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL environment variable is not set');
  console.warn('⚠️  Some features may not work without a database connection');
}

let client: ReturnType<typeof postgres> | null = null;
let db: any = null;
let isConnected = false;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    if (connectionString) {
      // Create the connection
      client = postgres(connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        onnotice: () => {}, // Disable notices
      });

      // Create the database instance
      db = drizzle(client, { schema });
      
      // Test the connection
      await client`SELECT 1`;
      isConnected = true;
      console.log('✅ Database connected successfully');
    }
  } catch (error) {
    console.warn('⚠️  Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    console.warn('⚠️  Running in fallback mode - some features may be limited');
    client = null;
    db = null;
    isConnected = false;
  }
};

// Initialize immediately but don't block
initializeDatabase().catch(() => {
  // Error already handled in initializeDatabase
});

// Export the database instance (may be null)
export { db, client };

// Export a helper to check if database is available
export const isDatabaseAvailable = () => isConnected;
