import { database } from '../src/config/database.js';
import { User, UserPoints, Product, Transaction, Mood, Cheer } from '../src/models/index.js';
import fs from 'fs';
import path from 'path';

const backupDatabase = async () => {
  try {
    console.log('📦 Starting database backup...');
    
    // Connect to database
    await database.connect();
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    // Generate timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `database-backup-${timestamp}.json`);
    
    // Fetch all data from collections
    console.log('📊 Exporting data...');
    
    const [users, userPoints, products, transactions, moods, cheers] = await Promise.all([
      User.find({}).lean(),
      UserPoints.find({}).lean(),
      Product.find({}).lean(),
      Transaction.find({}).lean(),
      Mood.find({}).lean(),
      Cheer.find({}).lean()
    ]);
    
    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      collections: {
        users: users,
        userPoints: userPoints,
        products: products,
        transactions: transactions,
        moods: moods,
        cheers: cheers
      },
      stats: {
        users: users.length,
        userPoints: userPoints.length,
        products: products.length,
        transactions: transactions.length,
        moods: moods.length,
        cheers: cheers.length
      }
    };
    
    // Write backup to file
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log('✅ Database backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log('\n📊 Backup Summary:');
    console.log(`   👥 Users: ${backup.stats.users}`);
    console.log(`   💰 User Points: ${backup.stats.userPoints}`);
    console.log(`   🛒 Products: ${backup.stats.products}`);
    console.log(`   💸 Transactions: ${backup.stats.transactions}`);
    console.log(`   😊 Moods: ${backup.stats.moods}`);
    console.log(`   🎉 Cheers: ${backup.stats.cheers}`);
    
    return backupFile;
    
  } catch (error) {
    console.error('❌ Error backing up database:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('👋 Disconnected from database');
  }
};

// Run the backup function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backupDatabase()
    .then((backupFile) => {
      console.log(`🎉 Backup completed successfully! File: ${backupFile}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Backup failed:', error);
      process.exit(1);
    });
}

export default backupDatabase;
