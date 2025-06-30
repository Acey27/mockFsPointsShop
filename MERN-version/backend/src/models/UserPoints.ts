import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User.js';

export interface IUserPoints extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | IUser;
  availablePoints: number;
  totalEarned: number;
  totalSpent: number;
  monthlyCheerLimit: number;
  monthlyCheerUsed: number;
  lastMonthlyReset: Date;
  lastTransactionAt?: Date;
  updatedAt: Date;
}

export interface UserPointsModel extends Model<IUserPoints> {
  findByUserId(userId: string | mongoose.Types.ObjectId): Promise<IUserPoints | null>;
  createForUser(userId: string | mongoose.Types.ObjectId): Promise<IUserPoints>;
  updatePoints(userId: string | mongoose.Types.ObjectId, pointsChange: number): Promise<IUserPoints | null>;
  resetMonthlyCheerUsage(): Promise<void>;
}

const userPointsSchema = new Schema<IUserPoints, UserPointsModel>({
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
    transform: function(doc: any, ret: any) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
userPointsSchema.index({ userId: 1 }, { unique: true });
userPointsSchema.index({ availablePoints: -1 });
userPointsSchema.index({ totalEarned: -1 });
userPointsSchema.index({ lastMonthlyReset: 1 });

// Validation: monthlyCheerUsed cannot exceed monthlyCheerLimit
userPointsSchema.pre('save', function(next: any) {
  if (this.monthlyCheerUsed > this.monthlyCheerLimit) {
    const error = new Error('Monthly cheer used cannot exceed monthly cheer limit');
    return next(error);
  }
  next();
});

// Static method to find by user ID
userPointsSchema.statics.findByUserId = function(userId: string | mongoose.Types.ObjectId) {
  return this.findOne({ userId }).populate('userId', 'name email department avatar');
};

// Static method to create points record for new user
userPointsSchema.statics.createForUser = function(userId: string | mongoose.Types.ObjectId) {
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
userPointsSchema.statics.updatePoints = async function(
  userId: string | mongoose.Types.ObjectId, 
  pointsChange: number
) {
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

export const UserPoints = mongoose.model<IUserPoints, UserPointsModel>('UserPoints', userPointsSchema);
export default UserPoints;
