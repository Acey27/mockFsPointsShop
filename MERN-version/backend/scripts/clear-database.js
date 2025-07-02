import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    console.log('\n🧹 Clearing all collections...');
    
    for (const collectionName of collectionNames) {
      try {
        await mongoose.connection.db.dropCollection(collectionName);
        console.log(`   ✅ Dropped: ${collectionName}`);
      } catch (error) {
        console.log(`   ⚠️  Could not drop ${collectionName}: ${error.message}`);
      }
    }

    console.log('\n🎉 Database cleared successfully!');
    console.log('💡 All users, transactions, products, and other data have been removed.');
    
  } catch (error) {
    console.error('❌ Database cleanup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the cleanup
clearDatabase();
