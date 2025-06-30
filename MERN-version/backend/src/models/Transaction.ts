import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User.js';

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  fromUserId?: mongoose.Types.ObjectId | IUser;
  toUserId?: mongoose.Types.ObjectId | IUser;
  type: 'earned' | 'spent' | 'given' | 'received' | 'admin_grant' | 'admin_deduct';
  amount: number;
  description: string;
  message?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface TransactionModel extends Model<ITransaction> {
  findByUserId(
    userId: string | mongoose.Types.ObjectId,
    options?: { limit?: number; skip?: number; type?: string }
  ): Promise<ITransaction[]>;
  getPointsHistory(userId: string | mongoose.Types.ObjectId): Promise<{
    totalEarned: number;
    totalSpent: number;
    recentTransactions: ITransaction[];
  }>;
  createCheerTransaction(
    fromUserId: string | mongoose.Types.ObjectId,
    toUserId: string | mongoose.Types.ObjectId,
    amount: number,
    message?: string
  ): Promise<ITransaction[]>;
  createPurchaseTransaction(
    userId: string | mongoose.Types.ObjectId,
    amount: number,
    description: string,
    metadata?: Record<string, any>
  ): Promise<ITransaction>;
}

const transactionSchema = new Schema<ITransaction, TransactionModel>({
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
    enum: ['earned', 'spent', 'given', 'received', 'admin_grant', 'admin_deduct'],
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
    transform: function(doc: any, ret: any) {
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

// Validation: Either fromUserId or toUserId must be present (or both for transfers)
transactionSchema.pre('validate', function(next: any) {
  if (!this.fromUserId && !this.toUserId) {
    const error = new Error('Either fromUserId or toUserId must be specified');
    return next(error);
  }
  next();
});

// Static method to find transactions by user ID
transactionSchema.statics.findByUserId = function(
  userId: string | mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; type?: string } = {}
) {
  const { limit = 20, skip = 0, type } = options;
  
  const query: any = {
    $or: [
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
transactionSchema.statics.getPointsHistory = async function(userId: string | mongoose.Types.ObjectId) {
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
transactionSchema.statics.createCheerTransaction = async function(
  fromUserId: string | mongoose.Types.ObjectId,
  toUserId: string | mongoose.Types.ObjectId,
  amount: number,
  message?: string
) {
  const transactions = await Promise.all([
    // Create "given" transaction for sender
    this.create({
      fromUserId,
      toUserId,
      type: 'given',
      amount,
      description: 'Points given to colleague',
      message,
      metadata: { transactionType: 'cheer' }
    }),
    // Create "received" transaction for recipient
    this.create({
      fromUserId,
      toUserId,
      type: 'received',
      amount,
      description: 'Points received from colleague',
      message,
      metadata: { transactionType: 'cheer' }
    })
  ]);
  
  return transactions;
};

// Static method to create purchase transaction
transactionSchema.statics.createPurchaseTransaction = function(
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  description: string,
  metadata?: Record<string, any>
) {
  return this.create({
    fromUserId: userId,
    type: 'spent',
    amount,
    description,
    metadata
  });
};

export const Transaction = mongoose.model<ITransaction, TransactionModel>('Transaction', transactionSchema);
export default Transaction;
