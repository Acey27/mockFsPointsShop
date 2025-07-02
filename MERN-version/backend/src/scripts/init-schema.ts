/**
 * Database Schema Initialization Script
 * This script creates all collections with proper indexes and constraints
 * for the Points Shop MERN application
 */

import mongoose from 'mongoose';
import { config } from '../config/index.js';

interface SchemaDefinition {
  name: string;
  schema: any;
  indexes: Array<{
    fields: Record<string, any>;
    options?: Record<string, any>;
  }>;
}

// Define all collection schemas with their indexes
const schemas: SchemaDefinition[] = [
  // Users Collection
  {
    name: 'users',
    schema: {
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
      },
      password: {
        type: String,
        required: true,
        minlength: 6,
        select: false
      },
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
      },
      department: {
        type: String,
        required: true,
        enum: ['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations', 'HR', 'Finance', 'Customer Success', 'Other']
      },
      avatar: {
        type: String,
        default: null
      },
      role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
      },
      isActive: {
        type: Boolean,
        default: true
      },
      lastLogin: {
        type: Date,
        default: null
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { email: 1 }, options: { unique: true } },
      { fields: { department: 1 } },
      { fields: { role: 1 } },
      { fields: { isActive: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { name: 'text', email: 'text' }, options: { name: 'user_search' } }
    ]
  },

  // UserPoints Collection
  {
    name: 'userpoints',
    schema: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
      },
      availablePoints: {
        type: Number,
        default: 0,
        min: 0
      },
      totalEarned: {
        type: Number,
        default: 0,
        min: 0
      },
      totalSpent: {
        type: Number,
        default: 0,
        min: 0
      },
      monthlyCheerLimit: {
        type: Number,
        default: 100,
        min: 0
      },
      monthlyCheerUsed: {
        type: Number,
        default: 0,
        min: 0
      },
      lastMonthlyReset: {
        type: Date,
        default: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { userId: 1 }, options: { unique: true } },
      { fields: { availablePoints: -1 } },
      { fields: { totalEarned: -1 } },
      { fields: { lastMonthlyReset: 1 } }
    ]
  },

  // Transactions Collection
  {
    name: 'transactions',
    schema: {
      fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      type: {
        type: String,
        enum: ['earned', 'spent', 'given', 'received', 'admin_grant', 'admin_deduct'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: {
        type: String,
        required: true,
        maxlength: 500
      },
      message: {
        type: String,
        maxlength: 1000,
        default: null
      },
      reason: {
        type: String,
        enum: ['peer_recognition', 'purchase', 'refund', 'bonus', 'admin_adjustment', 'welcome_bonus', 'monthly_bonus'],
        required: true
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        default: null
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { toUserId: 1, createdAt: -1 } },
      { fields: { fromUserId: 1, createdAt: -1 } },
      { fields: { type: 1, createdAt: -1 } },
      { fields: { reason: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { orderId: 1 } },
      { fields: { type: 1, toUserId: 1, createdAt: -1 } }
    ]
  },

  // Products Collection
  {
    name: 'products',
    schema: {
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
      },
      description: {
        type: String,
        required: true,
        maxlength: 2000
      },
      image: {
        type: String,
        required: true
      },
      pointsCost: {
        type: Number,
        required: true,
        min: 1
      },
      category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Gift Cards', 'Office Supplies', 'Experiences', 'Food & Beverage', 'Apparel', 'Other']
      },
      inventory: {
        type: Number,
        required: true,
        min: 0,
        default: 0
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
      },
      reviewCount: {
        type: Number,
        min: 0,
        default: 0
      },
      isActive: {
        type: Boolean,
        default: true
      },
      isFeatured: {
        type: Boolean,
        default: false
      },
      tags: [{
        type: String,
        trim: true
      }],
      specifications: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { category: 1, isActive: 1 } },
      { fields: { pointsCost: 1 } },
      { fields: { rating: -1 } },
      { fields: { isActive: 1, isFeatured: -1 } },
      { fields: { inventory: 1 } },
      { fields: { createdAt: -1 } },
      { fields: { name: 'text', description: 'text', tags: 'text' }, options: { name: 'product_search' } }
    ]
  },

  // Orders Collection
  {
    name: 'orders',
    schema: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      orderNumber: {
        type: String,
        unique: true,
        required: true
      },
      items: [{
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        pointsCostPerItem: {
          type: Number,
          required: true,
          min: 1
        },
        totalPoints: {
          type: Number,
          required: true,
          min: 1
        }
      }],
      totalPoints: {
        type: Number,
        required: true,
        min: 1
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
        default: 'pending'
      },
      shippingAddress: {
        name: String,
        email: String,
        address: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'US' }
      },
      tracking: {
        provider: String,
        trackingNumber: String,
        url: String
      },
      notes: {
        type: String,
        maxlength: 1000
      },
      adminNotes: {
        type: String,
        maxlength: 1000
      },
      processedAt: {
        type: Date,
        default: null
      },
      shippedAt: {
        type: Date,
        default: null
      },
      deliveredAt: {
        type: Date,
        default: null
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { userId: 1, createdAt: -1 } },
      { fields: { status: 1, createdAt: -1 } },
      { fields: { orderNumber: 1 }, options: { unique: true } },
      { fields: { createdAt: -1 } },
      { fields: { processedAt: 1 } },
      { fields: { 'items.productId': 1 } }
    ]
  },

  // Moods Collection
  {
    name: 'moods',
    schema: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      mood: {
        type: String,
        enum: ['excellent', 'good', 'okay', 'not-great', 'poor'],
        required: true
      },
      moodScore: {
        type: Number,
        min: 1,
        max: 5,
        required: true
      },
      comment: {
        type: String,
        maxlength: 500,
        default: null
      },
      tags: [{
        type: String,
        enum: ['work', 'personal', 'team', 'project', 'stress', 'achievement', 'learning', 'health', 'other']
      }],
      date: {
        type: Date,
        required: true,
        default: () => new Date().toISOString().split('T')[0]
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { userId: 1, date: -1 } },
      { fields: { userId: 1, createdAt: -1 } },
      { fields: { mood: 1, date: -1 } },
      { fields: { date: -1 } },
      { fields: { createdAt: -1 } },
      { fields: { userId: 1, date: 1 }, options: { unique: true } } // One mood per user per day
    ]
  },

  // Sessions Collection (for refresh tokens and session management)
  {
    name: 'sessions',
    schema: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      refreshToken: {
        type: String,
        required: true,
        unique: true
      },
      userAgent: {
        type: String,
        default: null
      },
      ipAddress: {
        type: String,
        default: null
      },
      isActive: {
        type: Boolean,
        default: true
      },
      expiresAt: {
        type: Date,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { userId: 1, isActive: 1 } },
      { fields: { refreshToken: 1 }, options: { unique: true } },
      { fields: { expiresAt: 1 }, options: { expireAfterSeconds: 0 } }, // TTL index
      { fields: { createdAt: -1 } }
    ]
  },

  // Notifications Collection
  {
    name: 'notifications',
    schema: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      type: {
        type: String,
        enum: ['points_received', 'order_status', 'system_announcement', 'reminder', 'achievement'],
        required: true
      },
      title: {
        type: String,
        required: true,
        maxlength: 200
      },
      message: {
        type: String,
        required: true,
        maxlength: 1000
      },
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      },
      isRead: {
        type: Boolean,
        default: false
      },
      readAt: {
        type: Date,
        default: null
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    },
    indexes: [
      { fields: { userId: 1, isRead: 1, createdAt: -1 } },
      { fields: { userId: 1, createdAt: -1 } },
      { fields: { type: 1 } },
      { fields: { createdAt: -1 } }
    ]
  }
];

// Function to create database schema
export async function createDatabaseSchema() {
  try {
    console.log('🚀 Initializing database schema...');
    
    // Connect to MongoDB
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME
    });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    console.log('✅ Connected to MongoDB');
    
    // Get existing collections
    const existingCollections = await db.listCollections().toArray();
    const existingCollectionNames = existingCollections.map(col => col.name);

    for (const schemaDefinition of schemas) {
      const { name, schema, indexes } = schemaDefinition;
      
      try {
        // Create collection if it doesn't exist
        if (!existingCollectionNames.includes(name)) {
          await db.createCollection(name, {
            validator: {
              $jsonSchema: {
                bsonType: "object",
                description: `${name} collection schema`
              }
            }
          });
          console.log(`✅ Created collection: ${name}`);
        } else {
          console.log(`ℹ️  Collection already exists: ${name}`);
        }

        const collection = db.collection(name);

        // Create indexes
        for (const indexDef of indexes) {
          try {
            await collection.createIndex(indexDef.fields, indexDef.options || {});
            console.log(`✅ Created index on ${name}:`, Object.keys(indexDef.fields).join(', '));
          } catch (indexError: any) {
            if (indexError.code === 85) {
              console.log(`ℹ️  Index already exists on ${name}:`, Object.keys(indexDef.fields).join(', '));
            } else {
              console.error(`❌ Error creating index on ${name}:`, indexError.message);
            }
          }
        }

      } catch (collectionError) {
        console.error(`❌ Error with collection ${name}:`, collectionError);
      }
    }

    console.log('🎉 Database schema initialization completed!');
    
    // Display collection stats
    console.log('\n📊 Database Collections:');
    for (const schemaDefinition of schemas) {
      const collection = db.collection(schemaDefinition.name);
      const count = await collection.countDocuments();
      const indexes = await collection.listIndexes().toArray();
      console.log(`  ${schemaDefinition.name}: ${count} documents, ${indexes.length} indexes`);
    }

  } catch (error) {
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
}

// Function to drop and recreate schema (for development)
export async function resetDatabaseSchema() {
  try {
    console.log('⚠️  Resetting database schema...');
    
    await mongoose.connect(config.MONGODB_URI, {
      dbName: config.MONGODB_DB_NAME
    });

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }

    // Drop all collections
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      await db.dropCollection(collection.name);
      console.log(`🗑️  Dropped collection: ${collection.name}`);
    }

    // Recreate schema
    await createDatabaseSchema();
    
    console.log('✅ Database schema reset completed!');
  } catch (error) {
    console.error('❌ Error resetting database schema:', error);
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2];
  
  if (command === 'reset') {
    resetDatabaseSchema()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    createDatabaseSchema()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}
