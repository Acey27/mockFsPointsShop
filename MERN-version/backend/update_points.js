import mongoose from 'mongoose';

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://dbJelo:jelo1234@jelodb.xexfini.mongodb.net/jelodb?retryWrites=true&w=majority';

async function updateAllUserPoints() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users:`);
    
    for (const user of users) {
      console.log(`\n--- Processing ${user.email} ---`);
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name || 'N/A'}`);
      console.log(`Role: ${user.role}`);
      
      // Check if user already has points
      const existingPoints = await mongoose.connection.db.collection('userpoints').findOne({userId: user._id});
      
      if (!existingPoints) {
        // Create new points record
        const newPoints = {
          userId: user._id,
          availablePoints: 10000,
          totalEarned: 10000,
          totalSpent: 0,
          monthlyCheerLimit: 100,
          monthlyCheerUsed: 0,
          lastMonthlyReset: new Date(),
          lastTransactionAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await mongoose.connection.db.collection('userpoints').insertOne(newPoints);
        console.log('✅ Created new points record with 10,000 points');
      } else {
        // Update existing points
        const newAvailable = existingPoints.availablePoints + 10000;
        const newTotal = existingPoints.totalEarned + 10000;
        
        await mongoose.connection.db.collection('userpoints').updateOne(
          {_id: existingPoints._id},
          {
            $set: {
              availablePoints: newAvailable,
              totalEarned: newTotal,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`✅ Updated points: ${existingPoints.availablePoints} → ${newAvailable}`);
      }
    }
    
    console.log(`\n🎉 Successfully updated ${users.length} users`);
    
    // Summary
    console.log('\n=== FINAL SUMMARY ===');
    const allPoints = await mongoose.connection.db.collection('userpoints').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          email: '$user.email',
          name: '$user.name',
          role: '$user.role',
          availablePoints: 1,
          totalEarned: 1
        }
      }
    ]).toArray();
    
    allPoints.forEach(p => {
      console.log(`${p.email} (${p.role}): ${p.availablePoints} points`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

updateAllUserPoints();
