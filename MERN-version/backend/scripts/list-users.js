import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../src/models/index.js';

// Load environment variables
dotenv.config();

async function listUsers() {
  try {
    console.log('🔍 Connecting to database to list users...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch all users
    const users = await User.find({}, {
      name: 1,
      email: 1,
      department: 1,
      role: 1,
      isActive: 1,
      createdAt: 1
    }).sort({ createdAt: -1 });

    console.log('\n📋 Registered Users in Database:');
    console.log('═'.repeat(80));
    
    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      console.log('💡 You may need to run the seed script first.');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${user.isActive ? 'Active' : 'Inactive'}`);
        console.log(`   Created: ${user.createdAt?.toLocaleDateString() || 'N/A'}`);
        console.log('   ' + '-'.repeat(50));
      });
      
      console.log(`\n📊 Total users: ${users.length}`);
      
      // Count by role
      const adminCount = users.filter(u => u.role === 'admin').length;
      const userCount = users.filter(u => u.role === 'user').length;
      console.log(`   Admins: ${adminCount}`);
      console.log(`   Regular Users: ${userCount}`);
    }

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

// Run the script
listUsers();
