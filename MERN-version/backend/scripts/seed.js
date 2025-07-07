import { database } from '../src/config/database.js';
import { User, UserPoints, Product, Transaction, Mood, Cheer } from '../src/models/index.js';
import bcrypt from 'bcryptjs';

// Sample data
const sampleUsers = [
  {
    email: 'admin@pointsshop.com',
    password: 'Admin123!',
    name: 'Admin User',
    department: 'Administration',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'admin'
  },
  {
    email: 'zeann.palma@company.com',
    password: 'Password123!',
    name: 'Zeann Palma',
    department: 'Engineering',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'user'
  },
  {
    email: 'francis.jelo@company.com',
    password: 'Password123!',
    name: 'Francis Jelo',
    department: 'Design',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'user'
  },
  {
    email: 'jasfer.delacruz@company.com',
    password: 'Password123!',
    name: 'Jasfer DelaCruz',
    department: 'Marketing',
    avatar: 'https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'user'
  },
  {
    email: 'czar.reenjit@company.com',
    password: 'Password123!',
    name: 'Czar Reenjit',
    department: 'Sales',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'user'
  },
  {
    email: 'john.smith@company.com',
    password: 'Password123!',
    name: 'John Smith',
    department: 'HR',
    avatar: 'https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'user'
  }
];

const sampleProducts = [
  {
    name: 'Company T-Shirt',
    description: 'Premium cotton t-shirt with company logo. Available in multiple sizes and colors.',
    image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 150,
    category: 'apparel',
    inventory: 25,
    rating: 4.5
  },
  {
    name: 'Coffee Mug',
    description: 'Ceramic mug perfect for your morning coffee. Dishwasher safe with company branding.',
    image: 'https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 75,
    category: 'accessories',
    inventory: 50,
    rating: 4.8
  },
  {
    name: 'Wireless Earbuds',
    description: 'High-quality bluetooth earbuds with noise cancellation and long battery life.',
    image: 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 500,
    category: 'electronics',
    inventory: 10,
    rating: 4.7
  },
  {
    name: 'Desk Plant',
    description: 'Small succulent plant for your workspace. Easy to care for and adds life to your desk.',
    image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 100,
    category: 'office',
    inventory: 30,
    rating: 4.6
  },
  {
    name: 'Amazon Gift Card - $25',
    description: 'Digital Amazon gift card worth $25. Perfect for online shopping.',
    image: 'https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 300,
    category: 'giftcards',
    inventory: 100,
    rating: 5.0
  },
  {
    name: 'Notebook Set',
    description: 'Premium notebook and pen set. Perfect for meetings and note-taking.',
    image: 'https://images.pexels.com/photos/167682/pexels-photo-167682.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 120,
    category: 'office',
    inventory: 40,
    rating: 4.4
  },
  {
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking and long battery life.',
    image: 'https://images.pexels.com/photos/2115217/pexels-photo-2115217.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 200,
    category: 'electronics',
    inventory: 20,
    rating: 4.3
  },
  {
    name: 'Water Bottle',
    description: 'Insulated stainless steel water bottle. Keeps drinks cold for 24 hours.',
    image: 'https://images.pexels.com/photos/1028637/pexels-photo-1028637.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 125,
    category: 'accessories',
    inventory: 35,
    rating: 4.5
  },
  {
    name: 'Bluetooth Speaker',
    description: 'Portable bluetooth speaker with rich sound quality and waterproof design.',
    image: 'https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 400,
    category: 'electronics',
    inventory: 15,
    rating: 4.6
  },
  {
    name: 'Hoodie',
    description: 'Comfortable hoodie with company logo. Perfect for casual wear.',
    image: 'https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?auto=compress&cs=tinysrgb&w=400',
    pointsCost: 250,
    category: 'apparel',
    inventory: 18,
    rating: 4.4
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await database.connect();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      UserPoints.deleteMany({}),
      Product.deleteMany({}),
      Transaction.deleteMany({}),
      Mood.deleteMany({})
    ]);
    
    // Create users
    console.log('👥 Creating users...');
    const users = [];
    for (const userData of sampleUsers) {
      const user = await User.create({
        ...userData
      });
      users.push(user);
      console.log(`  ✓ Created user: ${user.name} (${user.email})`);
    }
    
    // Create user points for each user
    console.log('💰 Creating user points...');
    const userPointsData = [];
    for (const user of users) {
      const initialPoints = user.role === 'admin' ? 10000 : Math.floor(Math.random() * 500) + 100;
      const userPoints = await UserPoints.create({
        userId: user._id,
        availablePoints: initialPoints,
        totalEarned: initialPoints,
        totalSpent: 0,
        monthlyCheerLimit: 100,
        monthlyCheerUsed: Math.floor(Math.random() * 30),
        lastMonthlyReset: new Date()
      });
      userPointsData.push(userPoints);
      console.log(`  ✓ Created points for ${user.name}: ${initialPoints} points`);
    }
    
    // Create products
    console.log('🛒 Creating products...');
    const products = [];
    for (const productData of sampleProducts) {
      const product = await Product.create(productData);
      products.push(product);
      console.log(`  ✓ Created product: ${product.name} (${product.pointsCost} points)`);
    }
    
    // Create sample transactions
    console.log('💸 Creating sample transactions...');
    const regularUsers = users.filter(u => u.role === 'user');
    
    // Create some simple transactions (without using the complex transaction method for seeding)
    for (let i = 0; i < 10; i++) {
      const fromUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const toUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      if (fromUser._id.toString() !== toUser._id.toString()) {
        const amount = Math.floor(Math.random() * 20) + 5; // 5-25 points
        const messages = [
          'Great job on the presentation!',
          'Thanks for helping with the project',
          'Outstanding work this week!',
          'Keep up the excellent work!',
          'You\'re doing amazing!',
          'Thanks for your collaboration',
          'Excellent problem-solving skills',
          'Great teamwork!'
        ];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        // Create simple transaction records
        await Transaction.create({
          fromUserId: fromUser._id,
          toUserId: toUser._id,
          type: 'given',
          amount,
          description: `Cheered ${toUser.name}`,
          message
        });
        
        await Transaction.create({
          fromUserId: fromUser._id,
          toUserId: toUser._id,
          type: 'received',
          amount,
          description: `Received cheer from ${fromUser.name}`,
          message
        });
        
        console.log(`  ✓ ${fromUser.name} cheered ${toUser.name} with ${amount} points`);
      }
    }
    
    // Create some mood entries
    console.log('😊 Creating mood entries...');
    const moods = ['excellent', 'good', 'okay', 'not-great', 'poor'];
    const moodComments = [
      'Having a great day!',
      'Feeling productive',
      'Everything is going well',
      'Just an okay day',
      'Could be better',
      'Stressed with deadlines',
      'Really enjoying the work',
      'Team collaboration is excellent'
    ];
    
    for (const user of regularUsers) {
      // Create mood entries for the past 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const mood = moods[Math.floor(Math.random() * moods.length)];
        const comment = Math.random() > 0.5 ? 
          moodComments[Math.floor(Math.random() * moodComments.length)] : 
          undefined;
        
        await Mood.create({
          userId: user._id,
          mood,
          comment,
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate())
        });
      }
      console.log(`  ✓ Created mood entries for ${user.name}`);
    }
    
    // Seed sample cheers
    console.log('\n🎉 Seeding sample cheers...');
    
    // Sample cheer messages
    const cheerMessages = [
      "Great job on the presentation! You really nailed it.",
      "Thanks for helping me with the project. You're awesome!",
      "Your positive attitude always brightens my day.",
      "Amazing work on the new feature implementation.",
      "You're such a team player, always willing to help others.",
      "Your creativity and innovation inspire us all.",
      "Thank you for going above and beyond on this task.",
      "Your attention to detail is impressive.",
      "You handled that difficult situation with grace.",
      "Your leadership skills are truly outstanding.",
      "Thanks for being such a great mentor.",
      "Your problem-solving skills are incredible.",
      "You always bring such positive energy to the team.",
      "Your dedication to quality is admirable.",
      "Thanks for always being reliable and dependable."
    ];

    // Clear existing cheers
    await Cheer.deleteMany({});
    
    // Create sample cheers
    const cheersToCreate = [];
    
    // Create some recent cheers (last 30 days)
    for (let i = 0; i < 25; i++) {
      const fromUser = users[Math.floor(Math.random() * users.length)];
      let toUser = users[Math.floor(Math.random() * users.length)];
      
      // Ensure fromUser and toUser are different
      while (fromUser._id.equals(toUser._id)) {
        toUser = users[Math.floor(Math.random() * users.length)];
      }
      
      const message = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];
      const points = Math.floor(Math.random() * 5) + 1; // 1-5 points
      
      // Random date within last 30 days
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
      
      cheersToCreate.push({
        fromUser: fromUser._id,
        toUser: toUser._id,
        message,
        points,
        createdAt: randomDate
      });
    }

    // Create some cheers from this week
    for (let i = 0; i < 15; i++) {
      const fromUser = users[Math.floor(Math.random() * users.length)];
      let toUser = users[Math.floor(Math.random() * users.length)];
      
      // Ensure fromUser and toUser are different
      while (fromUser._id.equals(toUser._id)) {
        toUser = users[Math.floor(Math.random() * users.length)];
      }
      
      const message = cheerMessages[Math.floor(Math.random() * cheerMessages.length)];
      const points = Math.floor(Math.random() * 5) + 1; // 1-5 points
      
      // Random date within this week
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 7));
      
      cheersToCreate.push({
        fromUser: fromUser._id,
        toUser: toUser._id,
        message,
        points,
        createdAt: randomDate
      });
    }

    // Insert cheers
    await Cheer.insertMany(cheersToCreate);
    console.log(`✅ Created ${cheersToCreate.length} sample cheers`);
    
    console.log('✅ Database seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Users: ${users.length}`);
    console.log(`   Products: ${products.length}`);
    console.log(`   Transactions: ~10 cheer transactions`);
    console.log(`   Mood entries: ${regularUsers.length * 7}`);
    console.log(`   Cheers: ${cheersToCreate.length}`);
    
    console.log(`\n🔐 Login credentials:`);
    console.log(`   Admin: admin@pointsshop.com / Admin123!`);
    console.log(`   User: zeann.palma@company.com / Password123!`);
    console.log(`   User: francis.jelo@company.com / Password123!`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await database.disconnect();
    console.log('👋 Disconnected from database');
  }
};

// Run the seed function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;
