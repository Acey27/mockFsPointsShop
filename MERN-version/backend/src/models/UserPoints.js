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

export const UserPoints = mongoose.model('UserPoints', userPointsSchema);
export default UserPoints;
