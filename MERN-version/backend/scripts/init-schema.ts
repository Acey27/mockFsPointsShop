import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User, UserPoints, Transaction, Product, Order, Mood } from '../src/models/index.js';

// Load environment variables
dotenv.config();

async function initializeSchema() {
  try {
    console.log('🚀 Initializing Points Shop database schema...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB Atlas');

    // Drop existing collections if they exist (for clean setup)
    const collections = await mongoose.connection.db!.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const schemaCollections = ['users', 'userpoints', 'transactions', 'products', 'orders', 'moods'];
    
    for (const collectionName of schemaCollections) {
      if (collectionNames.includes(collectionName)) {
        await mongoose.connection.db!.dropCollection(collectionName);
        console.log(`🗑️  Dropped existing collection: ${collectionName}`);
      }
    }

    // Create collections with indexes
    console.log('📊 Creating collections and indexes...');

    // Users collection
    await User.createCollection();
    console.log('✅ Users collection created');

    // UserPoints collection
    await UserPoints.createCollection();
    console.log('✅ UserPoints collection created');

    // Transactions collection
    await Transaction.createCollection();
    console.log('✅ Transactions collection created');

    // Products collection
    await Product.createCollection();
    console.log('✅ Products collection created');

    // Orders collection
    await Order.createCollection();
    console.log('✅ Orders collection created');

    // Moods collection
    await Mood.createCollection();
    console.log('✅ Moods collection created');

    console.log('\n🎉 Database schema initialized successfully!');
    console.log('\n📋 Collections created:');
    console.log('   - users (with email, department, role, isActive indexes)');
    console.log('   - userpoints (with userId, availablePoints, totalEarned indexes)');
    console.log('   - transactions (with user, type, date indexes)');
    console.log('   - products (with category, cost, active, text search indexes)');
    console.log('   - orders (with user, status, date indexes)');
    console.log('   - moods (with user, mood, date indexes)');

    // Display collection stats
    console.log('\n📊 Collection Statistics:');
    for (const collectionName of schemaCollections) {
      const count = await mongoose.connection.db!.collection(collectionName).countDocuments();
      console.log(`   ${collectionName}: ${count} documents`);
    }

  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the schema initialization
initializeSchema();
