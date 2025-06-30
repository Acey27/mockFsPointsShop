import bcrypt from 'bcryptjs';
import { db } from './connection.js';
import { users, userPoints, products, moodEntries, transactions } from './schema.js';

const mockUsers = [
  { 
    email: "zeann.palma@company.com", 
    name: "Zeann Palma", 
    department: "Engineering", 
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40",
    password: "password123"
  },
  { 
    email: "francis.jelo@company.com", 
    name: "Francis Jelo", 
    department: "Design", 
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40",
    password: "password123"
  },
  { 
    email: "jasfer.delacruz@company.com", 
    name: "Jasfer DelaCruz", 
    department: "Marketing", 
    avatar: "https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=40",
    password: "password123"
  },
  { 
    email: "czar.reenjit@company.com", 
    name: "Czar Reenjit", 
    department: "Sales", 
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=40",
    password: "password123"
  },
  { 
    email: "john.smith@company.com", 
    name: "John Smith", 
    department: "HR", 
    avatar: "https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=40",
    password: "password123"
  },
];

const mockProducts = [
  {
    name: "Company T-Shirt",
    description: "Premium cotton t-shirt with company logo",
    image: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 150,
    category: "apparel",
    inventory: 25,
    rating: "4.5",
  },
  {
    name: "Coffee Mug",
    description: "Ceramic mug perfect for your morning coffee",
    image: "https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 75,
    category: "accessories",
    inventory: 50,
    rating: "4.8",
  },
  {
    name: "Wireless Earbuds",
    description: "High-quality bluetooth earbuds",
    image: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 500,
    category: "electronics",
    inventory: 10,
    rating: "4.7",
  },
  {
    name: "Desk Plant",
    description: "Small succulent plant for your workspace",
    image: "https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 100,
    category: "office",
    inventory: 30,
    rating: "4.6",
  },
  {
    name: "Gift Card - $25",
    description: "Amazon gift card worth $25",
    image: "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 300,
    category: "giftcards",
    inventory: 100,
    rating: "5.0",
  },
  {
    name: "Notebook Set",
    description: "Premium notebook and pen set",
    image: "https://images.pexels.com/photos/167682/pexels-photo-167682.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 120,
    category: "office",
    inventory: 40,
    rating: "4.4",
  },
];

async function seedDatabase() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await db.delete(transactions);
    await db.delete(moodEntries);
    await db.delete(userPoints);
    await db.delete(products);
    await db.delete(users);

    // Create users
    console.log('Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const createdUsers = await db.insert(users).values(
      mockUsers.map(user => ({
        email: user.email,
        password: hashedPassword,
        name: user.name,
        department: user.department,
        avatar: user.avatar,
      }))
    ).returning();

    // Create user points
    console.log('Creating user points...');
    await db.insert(userPoints).values(
      createdUsers.map((user, index) => ({
        userId: user.id,
        availablePoints: 850 + (index * 100), // Varying point amounts
        totalEarned: 1200 + (index * 150),
        totalSpent: 350 + (index * 50),
        monthlyCheerUsed: 45 + (index * 5),
      }))
    );

    // Create products
    console.log('Creating products...');
    await db.insert(products).values(mockProducts);

    // Create some sample transactions
    console.log('Creating sample transactions...');
    const sampleTransactions = [
      {
        fromUserId: createdUsers[3].id, // Czar
        toUserId: createdUsers[0].id,   // Zeann
        type: 'given',
        amount: 25,
        description: 'Received cheer from Czar Reenjit',
        message: 'Great job on the presentation!',
      },
      {
        toUserId: createdUsers[0].id,
        type: 'spent',
        amount: -150,
        description: 'Redeemed Company T-Shirt',
      },
      {
        fromUserId: createdUsers[0].id,   // Zeann
        toUserId: createdUsers[1].id,     // Francis
        type: 'given',
        amount: 15,
        description: 'Cheered Francis Jelo',
        message: 'Thanks for helping with the project',
      },
      {
        fromUserId: createdUsers[2].id,   // Jasfer
        toUserId: createdUsers[0].id,     // Zeann
        type: 'given',
        amount: 30,
        description: 'Received cheer from Jasfer DelaCruz',
        message: 'Outstanding work this week!',
      },
    ];

    await db.insert(transactions).values(sampleTransactions);

    // Create some mood entries
    console.log('Creating mood entries...');
    const moodData = [
      { userId: createdUsers[0].id, mood: 'good', comment: 'Great team meeting today!' },
      { userId: createdUsers[1].id, mood: 'excellent', comment: 'Finished the project successfully' },
      { userId: createdUsers[2].id, mood: 'okay', comment: 'Busy day with lots of meetings' },
    ];

    await db.insert(moodEntries).values(moodData);

    console.log('✅ Database seeded successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${mockProducts.length} products`);
    console.log(`Created ${sampleTransactions.length} transactions`);
    console.log(`Created ${moodData.length} mood entries`);
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
