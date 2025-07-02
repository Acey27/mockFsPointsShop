import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function addProducts() {
  try {
    console.log('🛒 Adding products to database...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const products = [
      {
        name: 'Company T-Shirt',
        description: 'Premium cotton t-shirt with company logo. Available in multiple sizes and colors.',
        image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg',
        pointsCost: 150,
        category: 'apparel',
        inventory: 25,
        rating: 4.5,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Coffee Mug',
        description: 'Ceramic mug perfect for your morning coffee. Dishwasher safe with company branding.',
        image: 'https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg',
        pointsCost: 75,
        category: 'accessories',
        inventory: 50,
        rating: 4.8,
        isActive: true,
        isFeatured: false
      },
      {
        name: 'Wireless Earbuds',
        description: 'High-quality bluetooth earbuds with noise cancellation and long battery life.',
        image: 'https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg',
        pointsCost: 500,
        category: 'electronics',
        inventory: 10,
        rating: 4.7,
        isActive: true,
        isFeatured: true
      },
      {
        name: 'Desk Plant',
        description: 'Small succulent plant for your workspace decoration.',
        image: 'https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg',
        pointsCost: 100,
        category: 'office',
        inventory: 30,
        rating: 4.6,
        isActive: true,
        isFeatured: false
      }
    ];

    for (const product of products) {
      await mongoose.connection.db.collection('products').insertOne({
        ...product,
        tags: [product.category],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`   ✅ Added: ${product.name}`);
    }

    console.log(`\n🎉 Successfully added ${products.length} products!`);
    
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

addProducts();
