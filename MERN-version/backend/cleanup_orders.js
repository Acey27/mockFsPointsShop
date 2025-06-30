import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dbJelo:jelo1234@jelodb.xexfini.mongodb.net/jelodb?retryWrites=true&w=majority';

async function cleanupOrders() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check existing orders
    const orders = await mongoose.connection.db.collection('orders').find({}).toArray();
    console.log(`Found ${orders.length} existing orders`);
    
    if (orders.length > 0) {
      console.log('\n🗑️  Deleting old orders with invalid product references...');
      const deleteResult = await mongoose.connection.db.collection('orders').deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} orders`);
    }
    
    // Also clean up any transactions that might reference old orders
    const transactions = await mongoose.connection.db.collection('transactions').find({}).toArray();
    console.log(`\nFound ${transactions.length} existing transactions`);
    
    if (transactions.length > 0) {
      console.log('🗑️  Deleting old transactions...');
      const deleteTransResult = await mongoose.connection.db.collection('transactions').deleteMany({});
      console.log(`✅ Deleted ${deleteTransResult.deletedCount} transactions`);
    }
    
    console.log('\n🎉 Database cleanup complete!');
    console.log('Users can now place new orders with the new products.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

cleanupOrders();
