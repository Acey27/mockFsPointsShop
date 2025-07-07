import mongoose, { Schema } from 'mongoose';

const userPointsSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  availablePoints: {
    type: Number,
    default: 0,
    min: [0, 'Available points cannot be negative']
  },
  totalEarned: {
    type: Number,
    default: 0,
    min: [0, 'Total earned cannot be negative']
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, 'Total spent cannot be negative']
  },
  monthlyCheerLimit: {
    type: Number,
    default: 100,
    min: [0, 'Monthly cheer limit cannot be negative']
  },
  monthlyCheerUsed: {
    type: Number,
    default: 0,
    min: [0, 'Monthly cheer used cannot be negative']
  },
  lastMonthlyReset: {
    type: Date,
    default: Date.now
  },
  lastTransactionAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: { createdAt: false, updatedAt: true },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userPointsSchema.index({ availablePoints: -1 });
userPointsSchema.index({ totalEarned: -1 });
userPointsSchema.index({ lastMonthlyReset: 1 });

// Validation: monthlyCheerUsed cannot exceed monthlyCheerLimit
userPointsSchema.pre('save', function(next) {
  if (this.monthlyCheerUsed > this.monthlyCheerLimit) {
    const error = new Error('Monthly cheer used cannot exceed monthly cheer limit');
    return next(error);
  }
  next();
});

// Static method to find by user ID
userPointsSchema.statics.findByUserId = function(userId) {
  return this.findOne({ userId }).populate('userId', 'name email department avatar');
};

// Static method to create points record for new user
userPointsSchema.statics.createForUser = function(userId) {
  return this.create({
    userId,
    availablePoints: 0,
    totalEarned: 0,
    totalSpent: 0,
    monthlyCheerLimit: 100,
    monthlyCheerUsed: 0,
    lastMonthlyReset: new Date()
  });
};

// Static method to update points
userPointsSchema.statics.updatePoints = async function(userId, pointsChange) {
  const userPoints = await this.findOne({ userId });
  if (!userPoints) {
    throw new Error('User points record not found');
  }

  // Update available points
  userPoints.availablePoints += pointsChange;
  
  // Update totals based on whether points were added or subtracted
  if (pointsChange > 0) {
    userPoints.totalEarned += pointsChange;
  } else {
    userPoints.totalSpent += Math.abs(pointsChange);
  }

  // Ensure points don't go negative
  if (userPoints.availablePoints < 0) {
    throw new Error('Insufficient points');
  }

  return await userPoints.save();
};

// Static method to reset monthly cheer usage for all users
userPointsSchema.statics.resetMonthlyCheerUsage = async function() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  await this.updateMany(
    { lastMonthlyReset: { $lt: firstDayOfMonth } },
    { 
      monthlyCheerUsed: 0,
      lastMonthlyReset: now
    }
  );
};

// Static method to handle cheer transaction between users
userPointsSchema.statics.processCheerTransaction = async function(fromUserId, toUserId, amount, message) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get or create sender's points
    let senderPoints = await this.findOne({ userId: fromUserId }).session(session);
    if (!senderPoints) {
      senderPoints = await this.createForUser(fromUserId);
    }

    // Check and reset monthly cheer usage if needed
    const currentMonth = new Date();
    const lastReset = senderPoints.lastMonthlyReset;
    const isNewMonth = !lastReset || 
      lastReset.getMonth() !== currentMonth.getMonth() || 
      lastReset.getFullYear() !== currentMonth.getFullYear();

    if (isNewMonth) {
      senderPoints.monthlyCheerUsed = 0;
      senderPoints.lastMonthlyReset = currentMonth;
    }

    // Check monthly limit
    if (senderPoints.monthlyCheerUsed + amount > senderPoints.monthlyCheerLimit) {
      const remaining = senderPoints.monthlyCheerLimit - senderPoints.monthlyCheerUsed;
      throw new Error(`Monthly cheer limit exceeded. You can send ${remaining} more points this month.`);
    }

    // Get or create recipient's points
    let recipientPoints = await this.findOne({ userId: toUserId }).session(session);
    if (!recipientPoints) {
      recipientPoints = await this.createForUser(toUserId);
    }

    // Update sender's monthly cheer usage
    senderPoints.monthlyCheerUsed += amount;
    senderPoints.lastTransactionAt = currentMonth;
    await senderPoints.save({ session });

    // Update recipient's points
    recipientPoints.availablePoints += amount;
    recipientPoints.totalEarned += amount;
    recipientPoints.lastTransactionAt = currentMonth;
    await recipientPoints.save({ session });

    // Import Transaction model to create transaction records
    const { Transaction } = await import('./Transaction.js');

    // Create transaction records manually within the existing session
    const [senderTransaction, recipientTransaction] = await Promise.all([
      // Create "given" transaction for sender
      Transaction.create([{
        fromUserId,
        toUserId,
        type: 'given',
        amount,
        description: `Cheered user`,
        message: message || '',
        metadata: { 
          transactionType: 'cheer',
          recipientId: toUserId,
          cheerType: 'sent'
        }
      }], { session }),
      // Create "received" transaction for recipient
      Transaction.create([{
        fromUserId,
        toUserId,
        type: 'received',
        amount,
        description: `Received cheer`,
        message: message || '',
        metadata: { 
          transactionType: 'cheer',
          senderId: fromUserId,
          cheerType: 'received'
        }
      }], { session })
    ]);

    const transactions = [senderTransaction[0], recipientTransaction[0]];

    await session.commitTransaction();
    return {
      senderPoints,
      recipientPoints,
      transactions
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to get comprehensive cheer statistics for a user
userPointsSchema.statics.getCheerStats = async function(userId) {
  const userPoints = await this.findOne({ userId });
  if (!userPoints) {
    throw new Error('User points record not found');
  }

  // Import Cheer model for querying (changed from Transaction to match actual data)
  const { Cheer } = await import('./Cheer.js');

  // Get current month's cheer data from Cheer collection
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Get points given this month from Cheer collection
  const pointsGivenThisMonth = await Cheer.aggregate([
    {
      $match: {
        fromUser: new mongoose.Types.ObjectId(userId.toString()),
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$points' }
      }
    }
  ]);

  // Get points received this month from Cheer collection
  const pointsReceivedThisMonth = await Cheer.aggregate([
    {
      $match: {
        toUser: new mongoose.Types.ObjectId(userId.toString()),
        createdAt: { $gte: startOfMonth, $lte: endOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$points' }
      }
    }
  ]);

  // Get total heartbits received all time from Cheer collection
  const totalHeartBitsReceived = await Cheer.aggregate([
    {
      $match: {
        toUser: new mongoose.Types.ObjectId(userId.toString())
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$points' }
      }
    }
  ]);

  const pointsGiven = pointsGivenThisMonth[0]?.totalPoints || 0;
  const pointsReceived = pointsReceivedThisMonth[0]?.totalPoints || 0;
  const totalHeartBits = totalHeartBitsReceived[0]?.totalPoints || 0;

  return {
    // Current month data (using real-time calculations from Cheer collection)
    monthlyCheerLimit: userPoints.monthlyCheerLimit,
    monthlyCheerUsed: pointsGiven, // Use real-time data from Cheer collection
    monthlyCheerRemaining: userPoints.monthlyCheerLimit - pointsGiven,
    
    // Transaction-based data
    pointsGivenThisMonth: pointsGiven,
    pointsReceivedThisMonth: pointsReceived,
    
    // All-time data
    totalHeartBitsReceived: totalHeartBits,
    
    // User's general point data
    availablePoints: userPoints.availablePoints,
    totalEarned: userPoints.totalEarned,
    totalSpent: userPoints.totalSpent,
    
    // Metadata
    lastMonthlyReset: userPoints.lastMonthlyReset,
    lastTransactionAt: userPoints.lastTransactionAt
  };
};

export const UserPoints = mongoose.model('UserPoints', userPointsSchema);
export default UserPoints;
