import mongoose from 'mongoose';
import { config } from '../config/index.js';

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('URI:', config.MONGODB_URI.replace(/:[^:]*@/, ':****@'));
    console.log('Database Name:', config.MONGODB_DB_NAME);
    
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME
    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Test a simple operation
    const admin = mongoose.connection.db?.admin();
    const result = await admin?.ping();
    console.log('📊 Ping result:', result);
    
    // List databases
    const listResult = await admin?.listDatabases();
    console.log('🗄️ Available databases:', listResult?.databases?.map(db => db.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Connection closed');
  }
}

testConnection();
