import mongoose, { Schema } from 'mongoose';

const moodSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'not-great', 'poor'],
    required: [true, 'Mood is required'],
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
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
moodSchema.index({ userId: 1, date: -1 });
moodSchema.index({ date: -1 });
moodSchema.index({ mood: 1, date: -1 });

// Unique constraint: one mood entry per user per day
moodSchema.index({ userId: 1, date: 1 }, { unique: true });

// Helper function to get start of day
function getStartOfDay(date) {
  const dateObj = date ? new Date(date) : new Date();
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

// Static method to find moods by user ID
moodSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 30, skip = 0, startDate, endDate } = options;
  
  const query = { userId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(startDate);
    if (endDate) query.date.$lte = getStartOfDay(endDate);
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email department');
};

// Static method to get today's mood for a user
moodSchema.statics.getTodaysMood = function(userId) {
  const today = getStartOfDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return this.findOne({
    userId,
    date: { $gte: today, $lt: tomorrow }
  });
};

// Static method to get mood analytics for a user
moodSchema.statics.getMoodAnalytics = async function(userId, days = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const matchQuery = {
    date: { $gte: startDate, $lte: endDate }
  };
  
  if (userId) {
    matchQuery.userId = new mongoose.Types.ObjectId(userId.toString());
  }
  
  const pipeline = [
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        averageMoodScore: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$mood', 'excellent'] }, then: 5 },
            { case: { $eq: ['$mood', 'good'] }, then: 4 },
            { case: { $eq: ['$mood', 'okay'] }, then: 3 },
            { case: { $eq: ['$mood', 'not-great'] }, then: 2 },
            { case: { $eq: ['$mood', 'poor'] }, then: 1 }
          ],
          default: 3
        }}},
        moodCounts: { $push: '$mood' },
        totalEntries: { $sum: 1 }
      }
    }
  ];
  
  const [analytics] = await this.aggregate(pipeline);
  
  if (!analytics) {
    return {
      averageMoodScore: 0,
      moodDistribution: {},
      totalEntries: 0,
      streak: 0
    };
  }
  
  // Calculate mood distribution
  const moodDistribution = analytics.moodCounts.reduce((acc, mood) => {
    acc[mood] = (acc[mood] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate streak (simplified - consecutive days with mood entries)
  let streak = 0;
  if (userId) {
    const recentMoods = await this.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: -1 }).limit(days);
    
    const currentDate = new Date();
    for (const mood of recentMoods) {
      const moodDate = getStartOfDay(mood.date);
      const expectedDate = getStartOfDay(currentDate);
      
      if (moodDate.getTime() === expectedDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
  }
  
  return {
    averageMoodScore: Math.round(analytics.averageMoodScore * 100) / 100,
    moodDistribution,
    totalEntries: analytics.totalEntries,
    streak
  };
};

// Static method to get team mood analytics
moodSchema.statics.getTeamMoodAnalytics = async function(department) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30); // Last 30 days
  
  const pipeline = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        'user.isActive': true,
        ...(department && { 'user.department': department })
      }
    },
    {
      $group: {
        _id: department ? null : '$user.department',
        averageMoodScore: { $avg: { $switch: {
          branches: [
            { case: { $eq: ['$mood', 'excellent'] }, then: 5 },
            { case: { $eq: ['$mood', 'good'] }, then: 4 },
            { case: { $eq: ['$mood', 'okay'] }, then: 3 },
            { case: { $eq: ['$mood', 'not-great'] }, then: 2 },
            { case: { $eq: ['$mood', 'poor'] }, then: 1 }
          ],
          default: 3
        }}},
        moodCounts: { $push: '$mood' },
        totalEntries: { $sum: 1 }
      }
    }
  ];
  
  const results = await this.aggregate(pipeline);
  
  if (results.length === 0) {
    return {
      averageMoodScore: 0,
      moodDistribution: {},
      totalEntries: 0
    };
  }
  
  if (department || results.length === 1) {
    // Single department or overall analytics
    const analytics = results[0];
    const moodDistribution = analytics.moodCounts.reduce((acc, mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
      return acc;
    }, {});
    
    return {
      averageMoodScore: Math.round(analytics.averageMoodScore * 100) / 100,
      moodDistribution,
      totalEntries: analytics.totalEntries
    };
  } else {
    // Multiple departments - return breakdown
    const departmentBreakdown = {};
    let totalScore = 0;
    let totalEntries = 0;
    const overallMoodCounts = {};
    
    results.forEach(dept => {
      const moodDistribution = dept.moodCounts.reduce((acc, mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
        overallMoodCounts[mood] = (overallMoodCounts[mood] || 0) + 1;
        return acc;
      }, {});
      
      departmentBreakdown[dept._id] = {
        averageMoodScore: Math.round(dept.averageMoodScore * 100) / 100,
        moodDistribution,
        totalEntries: dept.totalEntries
      };
      
      totalScore += dept.averageMoodScore * dept.totalEntries;
      totalEntries += dept.totalEntries;
    });
    
    return {
      averageMoodScore: totalEntries > 0 ? Math.round((totalScore / totalEntries) * 100) / 100 : 0,
      moodDistribution: overallMoodCounts,
      totalEntries,
      departmentBreakdown
    };
  }
};

// Pre-save middleware to set date to start of day
moodSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('date')) {
    this.date = getStartOfDay(this.date);
  }
  next();
});

export const Mood = mongoose.model('Mood', moodSchema);
export default Mood;
