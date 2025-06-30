import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dbJelo:jelo1234@jelodb.xexfini.mongodb.net/jelodb?retryWrites=true&w=majority';

const mockProducts = [
  {
    name: "Company T-Shirt",
    description: "Premium cotton t-shirt with company logo",
    image: "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 150,
    category: "apparel",
    inventory: 25,
    rating: 4.5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Coffee Mug",
    description: "Ceramic mug perfect for your morning coffee",
    image: "https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 75,
    category: "accessories",
    inventory: 50,
    rating: 4.8,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Wireless Earbuds",
    description: "High-quality bluetooth earbuds",
    image: "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 500,
    category: "electronics",
    inventory: 10,
    rating: 4.7,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Desk Plant",
    description: "Small succulent plant for your workspace",
    image: "https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 100,
    category: "office",
    inventory: 30,
    rating: 4.6,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Gift Card - $25",
    description: "Amazon gift card worth $25",
    image: "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 300,
    category: "giftcards",
    inventory: 100,
    rating: 5.0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Notebook Set",
    description: "Premium notebook and pen set",
    image: "https://images.pexels.com/photos/167682/pexels-photo-167682.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 120,
    category: "office",
    inventory: 40,
    rating: 4.4,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function replaceProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Delete all existing products
    console.log('\n🗑️  Deleting existing products...');
    const deleteResult = await mongoose.connection.db.collection('products').deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing products`);
    
    // Insert new products
    console.log('\n📦 Inserting new products...');
    const insertResult = await mongoose.connection.db.collection('products').insertMany(mockProducts);
    console.log(`✅ Inserted ${insertResult.insertedCount} new products`);
    
    // Display the new products
    console.log('\n=== NEW PRODUCTS ===');
    const products = await mongoose.connection.db.collection('products').find({}).toArray();
    
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Price: ${product.pointsCost} points`);
      console.log(`   Category: ${product.category}`);
      console.log(`   Inventory: ${product.inventory}`);
      console.log(`   Rating: ${product.rating}/5.0`);
      console.log(`   ID: ${product._id}`);
      console.log('');
    });
    
    console.log(`🎉 Successfully replaced products! Total: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

replaceProducts();
