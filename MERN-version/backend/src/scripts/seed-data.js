/**
 * Database Seed Script
 * Populates the database with initial data for testing and development
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';
import { User, UserPoints, Product, Transaction, Mood } from '../models/index.js';

// Seed data
const seedUsers = [
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    department: 'Engineering',
    role: 'admin',
    isActive: true
  },
  {
    email: 'user@example.com',
    password: 'user123',
    name: 'John Doe',
    department: 'Product',
    role: 'user',
    isActive: true
  },
  {
    email: 'jane.smith@example.com',
    password: 'jane123',
    name: 'Jane Smith',
    department: 'Design',
    role: 'user',
    isActive: true
  },
  {
    email: 'bob.wilson@example.com',
    password: 'bob123',
    name: 'Bob Wilson',
    department: 'Marketing',
    role: 'user',
    isActive: true
  },
  {
    email: 'alice.johnson@example.com',
    password: 'alice123',
    name: 'Alice Johnson',
    department: 'Sales',
    role: 'user',
    isActive: true
  }
];

const seedProducts = [
  // Electronics
  {
    name: 'Apple AirPods Pro',
    description: 'Active Noise Cancellation for immersive sound. Transparency mode for hearing and connecting with the world around you.',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 500,
    category: 'electronics',
    inventory: 25,
    rating: 4.8,
    reviewCount: 156,
    isActive: true,
    isFeatured: true,
    tags: ['apple', 'wireless', 'noise-cancelling']
  },
  {
    name: 'Wireless Charging Pad',
    description: 'Fast wireless charging for Qi-enabled devices. Sleek design that complements any desk or nightstand.',
    image: 'https://images.unsplash.com/photo-1572635196243-4dd75fbdbd7f?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 150,
    category: 'electronics',
    inventory: 50,
    rating: 4.5,
    reviewCount: 89,
    isActive: true,
    tags: ['wireless', 'charging', 'qi']
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable Bluetooth speaker with 360-degree sound and 12-hour battery life.',
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 200,
    category: 'electronics',
    inventory: 30,
    rating: 4.6,
    reviewCount: 234,
    isActive: true,
    tags: ['bluetooth', 'speaker', 'portable']
  },

  // Gift Cards
  {
    name: 'Amazon Gift Card - $25',
    description: 'Perfect for shopping on Amazon. No expiration date and can be used for millions of items.',
    image: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 250,
    category: 'giftcards',
    inventory: 100,
    rating: 5.0,
    reviewCount: 45,
    isActive: true,
    isFeatured: true,
    tags: ['amazon', 'gift-card', 'shopping']
  },
  {
    name: 'Starbucks Gift Card - $15',
    description: 'Enjoy your favorite coffee, tea, or snack at any Starbucks location.',
    image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 150,
    category: 'giftcards',
    inventory: 75,
    rating: 4.9,
    reviewCount: 67,
    isActive: true,
    tags: ['starbucks', 'coffee', 'gift-card']
  },
  {
    name: 'Netflix Gift Card - $30',
    description: 'Stream unlimited movies and TV shows with this Netflix gift card.',
    image: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 300,
    category: 'giftcards',
    inventory: 50,
    rating: 4.8,
    reviewCount: 23,
    isActive: true,
    tags: ['netflix', 'streaming', 'entertainment']
  },

  // Office Supplies
  {
    name: 'Ergonomic Mouse Pad',
    description: 'Memory foam wrist support for comfortable computing. Non-slip base keeps pad in place.',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 75,
    category: 'office',
    inventory: 40,
    rating: 4.4,
    reviewCount: 78,
    isActive: true,
    tags: ['ergonomic', 'mouse-pad', 'office']
  },
  {
    name: 'Desk Plant - Succulent',
    description: 'Low-maintenance succulent plant to brighten up your workspace. Comes with decorative pot.',
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 50,
    category: 'office',
    inventory: 60,
    rating: 4.7,
    reviewCount: 92,
    isActive: true,
    tags: ['plant', 'succulent', 'office-decor']
  },

  // Experiences
  {
    name: 'Virtual Team Building Activity',
    description: 'Fun 1-hour virtual team building session with professional facilitator.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 800,
    category: 'experiences',
    inventory: 10,
    rating: 4.9,
    reviewCount: 15,
    isActive: true,
    isFeatured: true,
    tags: ['team-building', 'virtual', 'experience']
  },
  {
    name: 'Online Learning Course',
    description: 'Access to premium online courses on platforms like Udemy or Coursera.',
    image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 400,
    category: 'experiences',
    inventory: 25,
    rating: 4.6,
    reviewCount: 34,
    isActive: true,
    tags: ['learning', 'education', 'online-course']
  },

  // Food & Beverage
  {
    name: 'Gourmet Coffee Beans - 1lb',
    description: 'Premium single-origin coffee beans, freshly roasted and delivered to your door.',
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 120,
    category: 'food',
    inventory: 35,
    rating: 4.7,
    reviewCount: 124,
    isActive: true,
    tags: ['coffee', 'gourmet', 'beans']
  },
  {
    name: 'Artisan Tea Collection',
    description: 'Curated selection of 8 premium teas from around the world. Perfect for tea enthusiasts.',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&auto=format&fit=crop&q=80.jpg',
    pointsCost: 180,
    category: 'food',
    inventory: 20,
    rating: 4.8,
    reviewCount: 67,
    isActive: true,
    tags: ['tea', 'artisan', 'collection']
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME
    });

    console.log('✅ Connected to MongoDB');

    // Clear existing data (in development only)
    if (config.NODE_ENV === 'development') {
      console.log('🧹 Clearing existing data...');
      await Promise.all([
        User.deleteMany({}),
        UserPoints.deleteMany({}),
        Product.deleteMany({}),
        Transaction.deleteMany({}),
        Mood.deleteMany({})
      ]);
      console.log('✅ Existing data cleared');
    }

    // Seed Users
    console.log('👥 Seeding users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      // Don't hash password here - the User model pre-save middleware will handle it
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`  ✅ Created user: ${user.email}`);
    }

    // Seed UserPoints for each user
    console.log('💰 Seeding user points...');
    for (const user of createdUsers) {
      const initialPoints = user.role === 'admin' ? 10000 : Math.floor(Math.random() * 1000) + 500;
      const userPoints = new UserPoints({
        userId: user._id,
        availablePoints: initialPoints,
        totalEarned: initialPoints,
        totalSpent: 0,
        monthlyCheerLimit: 100,
        monthlyCheerUsed: Math.floor(Math.random() * 30)
      });
      await userPoints.save();
      console.log(`  ✅ Created points for ${user.name}: ${initialPoints} points`);
    }

    // Seed Products
    console.log('🛍️ Seeding products...');
    const createdProducts = [];
    for (const productData of seedProducts) {
      const product = new Product(productData);
      await product.save();
      createdProducts.push(product);
      console.log(`  ✅ Created product: ${product.name}`);
    }

    // Seed some sample transactions
    console.log('📊 Seeding transactions...');
    const regularUsers = createdUsers.filter((user) => user.role === 'user');
    const transactionTypes = [
      { type: 'earned', reason: 'peer_recognition', description: 'Peer recognition for great work' },
      { type: 'earned', reason: 'bonus', description: 'Monthly performance bonus' },
      { type: 'earned', reason: 'welcome_bonus', description: 'Welcome to the team bonus' },
      { type: 'spent', reason: 'purchase', description: 'Purchased reward from shop' }
    ];

    for (let i = 0; i < 20; i++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const randomTransaction = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = randomTransaction.type === 'earned' 
        ? Math.floor(Math.random() * 100) + 25 
        : -(Math.floor(Math.random() * 200) + 50);

      const transaction = new Transaction({
        toUserId: randomUser._id,
        fromUserId: randomTransaction.type === 'earned' && Math.random() > 0.5 
          ? regularUsers[Math.floor(Math.random() * regularUsers.length)]?._id 
          : undefined,
        type: randomTransaction.type,
        amount: Math.abs(amount),
        description: randomTransaction.description,
        reason: randomTransaction.reason,
        message: Math.random() > 0.5 ? 'Keep up the great work!' : undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
      });
      await transaction.save();
    }
    console.log('  ✅ Created 20 sample transactions');

    // Seed some mood entries
    console.log('😊 Seeding mood entries...');
    const moods = ['excellent', 'good', 'okay', 'not-great', 'poor'];
    const moodComments = [
      'Great day today!',
      'Productive meeting with the team',
      'Feeling a bit stressed',
      'Looking forward to the weekend',
      'Accomplished a lot today',
      null // Some entries without comments
    ];

    for (let i = 0; i < 15; i++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      const randomComment = moodComments[Math.floor(Math.random() * moodComments.length)];
      const moodScore = moods.indexOf(randomMood) + 1;

      const mood = new Mood({
        userId: randomUser._id,
        mood: randomMood,
        moodScore,
        comment: randomComment,
        date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000), // Random date within last 14 days
        createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000)
      });
      await mood.save();
    }
    console.log('  ✅ Created 15 sample mood entries');

    // Display summary
    console.log('\n🎉 Database seeding completed!');
    console.log('\n📊 Seeding Summary:');
    console.log(`  👥 Users: ${createdUsers.length}`);
    console.log(`  🛍️ Products: ${createdProducts.length}`);
    console.log(`  📊 Transactions: 20`);
    console.log(`  😊 Mood entries: 15`);

    console.log('\n🔑 Test Accounts:');
    for (const userData of seedUsers) {
      console.log(`  ${userData.role === 'admin' ? '👑' : '👤'} ${userData.email} / ${userData.password}`);
    }

    console.log('\n🌐 You can now start the server and login with any of the test accounts!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { seedDatabase };
