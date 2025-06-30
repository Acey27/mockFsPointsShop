// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the points-shop database
db = db.getSiblingDB('points-shop');

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('userpoints');
db.createCollection('transactions');
db.createCollection('products');
db.createCollection('orders');
db.createCollection('moods');

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "department": 1 });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });
db.users.createIndex({ "createdAt": -1 });

// UserPoints collection indexes
db.userpoints.createIndex({ "userId": 1 }, { unique: true });
db.userpoints.createIndex({ "availablePoints": -1 });
db.userpoints.createIndex({ "totalEarned": -1 });
db.userpoints.createIndex({ "lastMonthlyReset": 1 });

// Transactions collection indexes
db.transactions.createIndex({ "fromUserId": 1, "createdAt": -1 });
db.transactions.createIndex({ "toUserId": 1, "createdAt": -1 });
db.transactions.createIndex({ "type": 1, "createdAt": -1 });
db.transactions.createIndex({ "createdAt": -1 });

// Products collection indexes
db.products.createIndex({ "name": "text", "description": "text" });
db.products.createIndex({ "category": 1, "isActive": 1 });
db.products.createIndex({ "pointsCost": 1, "isActive": 1 });
db.products.createIndex({ "rating": -1, "isActive": 1 });
db.products.createIndex({ "inventory": 1, "isActive": 1 });
db.products.createIndex({ "createdAt": -1 });

// Orders collection indexes
db.orders.createIndex({ "userId": 1, "createdAt": -1 });
db.orders.createIndex({ "status": 1, "createdAt": -1 });
db.orders.createIndex({ "createdAt": -1 });

// Moods collection indexes
db.moods.createIndex({ "userId": 1, "date": -1 });
db.moods.createIndex({ "date": -1 });
db.moods.createIndex({ "mood": 1, "date": -1 });
db.moods.createIndex({ "userId": 1, "date": 1 }, { unique: true });

print('Indexes created successfully!');

// Create a default admin user (if needed)
const adminUser = {
  email: 'admin@pointsshop.com',
  // Note: Password will be hashed by the application
  name: 'System Administrator',
  department: 'Administration',
  role: 'admin',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

print('Database initialization completed!');
print('Collections and indexes have been set up for the Points Shop application.');
print('Use the seed script to populate the database with sample data.');
