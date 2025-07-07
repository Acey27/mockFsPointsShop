import { database } from '../src/config/database.js';
import { User, UserPoints, Product, Transaction, Mood, Cheer } from '../src/models/index.js';
import fs from 'fs';
import path from 'path';

const restoreDatabase = async (backupFilePath) => {
  try {
    console.log('🔄 Starting database restore...');
    
    // Check if backup file exists
    if (!fs.existsSync(backupFilePath)) {
      throw new Error(`Backup file not found: ${backupFilePath}`);
    }
    
    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    console.log(`📁 Reading backup from: ${backupFilePath}`);
    console.log(`📅 Backup created: ${backupData.timestamp}`);
    
    // Connect to database
    await database.connect();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      UserPoints.deleteMany({}),
      Product.deleteMany({}),
      Transaction.deleteMany({}),
      Mood.deleteMany({}),
      Cheer.deleteMany({})
    ]);
    
    // Restore data
    console.log('📤 Restoring data...');
    const { collections } = backupData;
    
    if (collections.users && collections.users.length > 0) {
      await User.insertMany(collections.users);
      console.log(`  ✓ Restored ${collections.users.length} users`);
    }
    
    if (collections.userPoints && collections.userPoints.length > 0) {
      await UserPoints.insertMany(collections.userPoints);
      console.log(`  ✓ Restored ${collections.userPoints.length} user points records`);
    }
    
    if (collections.products && collections.products.length > 0) {
      await Product.insertMany(collections.products);
      console.log(`  ✓ Restored ${collections.products.length} products`);
    }
    
    if (collections.transactions && collections.transactions.length > 0) {
      await Transaction.insertMany(collections.transactions);
      console.log(`  ✓ Restored ${collections.transactions.length} transactions`);
    }
    
    if (collections.moods && collections.moods.length > 0) {
      await Mood.insertMany(collections.moods);
      console.log(`  ✓ Restored ${collections.moods.length} mood entries`);
    }
    
    if (collections.cheers && collections.cheers.length > 0) {
      await Cheer.insertMany(collections.cheers);
      console.log(`  ✓ Restored ${collections.cheers.length} cheers`);
    }
    
    console.log('✅ Database restore completed successfully!');
    
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('👋 Disconnected from database');
  }
};

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupFilePath = process.argv[2];
  
  if (!backupFilePath) {
    console.error('❌ Please provide a backup file path');
    console.log('Usage: node restore-database.js <backup-file-path>');
    process.exit(1);
  }
  
  restoreDatabase(backupFilePath)
    .then(() => {
      console.log('🎉 Restore completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Restore failed:', error);
      process.exit(1);
    });
}

export default restoreDatabase;
