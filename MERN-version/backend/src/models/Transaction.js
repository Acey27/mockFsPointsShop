import mongoose, { Schema } from 'mongoose';

const transactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    // Legacy field for backward compatibility
  },
  fromUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  toUserId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  type: {
    type: String,
    enum: ['earned', 'spent', 'given', 'received', 'admin_grant', 'admin_deduct', 'refund'],
    required: [true, 'Transaction type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
transactionSchema.index({ fromUserId: 1, createdAt: -1 });
transactionSchema.index({ toUserId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Validation: Either userId (legacy), fromUserId, or toUserId must be present
transactionSchema.pre('validate', function(next) {
  if (!this.userId && !this.fromUserId && !this.toUserId) {
    const error = new Error('Either userId, fromUserId, or toUserId must be specified');
    return next(error);
  }
  next();
});

// Static method to find transactions by user ID
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 20, skip = 0, type } = options;
  
  const query = {
    $or: [
      { userId: userId }, // Legacy field
      { fromUserId: userId },
      { toUserId: userId }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('fromUserId', 'name email avatar department')
    .populate('toUserId', 'name email avatar department')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get points history summary
transactionSchema.statics.getPointsHistory = async function(userId) {
  const transactions = await this.findByUserId(userId, { limit: 10 });
  
  // Calculate totals
  const earned = await this.aggregate([
    {
      $match: {
        toUserId: new mongoose.Types.ObjectId(userId.toString()),
        type: { $in: ['earned', 'received', 'admin_grant'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  const spent = await this.aggregate([
    {
      $match: {
        fromUserId: new mongoose.Types.ObjectId(userId.toString()),
        type: { $in: ['spent', 'given', 'admin_deduct'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);
  
  return {
    totalEarned: earned[0]?.total || 0,
    totalSpent: spent[0]?.total || 0,
    recentTransactions: transactions
  };
};

// Static method to create cheer transaction (creates both given and received records)
transactionSchema.statics.createCheerTransaction = async function(fromUserId, toUserId, amount, message) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user details for better descriptions
    const { User } = await import('./User.js');
    const [senderUser, recipientUser] = await Promise.all([
      User.findById(fromUserId).select('name').session(session),
      User.findById(toUserId).select('name').session(session)
    ]);

    if (!senderUser || !recipientUser) {
      throw new Error('User not found');
    }

    const transactions = await Promise.all([
      // Create "given" transaction for sender
      this.create([{
        fromUserId,
        toUserId,
        type: 'given',
        amount,
        description: `Cheered ${recipientUser.name}`,
        message: message || '',
        metadata: { 
          transactionType: 'cheer',
          recipientId: toUserId,
          recipientName: recipientUser.name,
          cheerType: 'sent'
        }
      }], { session }),
      // Create "received" transaction for recipient
      this.create([{
        fromUserId,
        toUserId,
        type: 'received',
        amount,
        description: `Received cheer from ${senderUser.name}`,
        message: message || '',
        metadata: { 
          transactionType: 'cheer',
          senderId: fromUserId,
          senderName: senderUser.name,
          cheerType: 'received'
        }
      }], { session })
    ]);

    await session.commitTransaction();
    return [transactions[0][0], transactions[1][0]]; // Return the created documents
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method to create purchase transaction
transactionSchema.statics.createPurchaseTransaction = function(userId, amount, description, metadata) {
  return this.create({
    fromUserId: userId,
    type: 'spent',
    amount,
    description,
    metadata
  });
};

// Static method to get cheer transactions for a user
transactionSchema.statics.getCheerTransactions = function(userId, options = {}) {
  const { limit = 20, skip = 0, type: cheerType } = options;
  
  let query = {
    $or: [
      { fromUserId: userId },
      { toUserId: userId }
    ],
    'metadata.transactionType': 'cheer'
  };

  // Filter by cheer type (sent/received)
  if (cheerType === 'sent') {
    query = {
      fromUserId: userId,
      type: 'given',
      'metadata.transactionType': 'cheer'
    };
  } else if (cheerType === 'received') {
    query = {
      toUserId: userId,
      type: 'received',
      'metadata.transactionType': 'cheer'
    };
  }
  
  return this.find(query)
    .populate('fromUserId', 'name email avatar department')
    .populate('toUserId', 'name email avatar department')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get monthly cheer statistics
transactionSchema.statics.getMonthlyCheerStats = async function(userId, year, month) {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0);

  const [sentStats, receivedStats] = await Promise.all([
    // Points sent (given) this month
    this.aggregate([
      {
        $match: {
          fromUserId: new mongoose.Types.ObjectId(userId.toString()),
          type: 'given',
          'metadata.transactionType': 'cheer',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ]),
    // Points received this month
    this.aggregate([
      {
        $match: {
          toUserId: new mongoose.Types.ObjectId(userId.toString()),
          type: 'received',
          'metadata.transactionType': 'cheer',
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      }
    ])
  ]);

  return {
    sent: {
      totalPoints: sentStats[0]?.totalPoints || 0,
      transactionCount: sentStats[0]?.transactionCount || 0
    },
    received: {
      totalPoints: receivedStats[0]?.totalPoints || 0,
      transactionCount: receivedStats[0]?.transactionCount || 0
    },
    period: {
      year,
      month,
      startOfMonth,
      endOfMonth
    }
  };
};

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
