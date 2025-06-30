import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User.js';

export interface IMood extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | IUser;
  mood: 'excellent' | 'good' | 'okay' | 'not-great' | 'poor';
  comment?: string;
  date: Date;
  createdAt: Date;
}

export interface MoodModel extends Model<IMood> {
  findByUserId(
    userId: string | mongoose.Types.ObjectId,
    options?: { limit?: number; skip?: number; startDate?: Date; endDate?: Date }
  ): Promise<IMood[]>;
  getTodaysMood(userId: string | mongoose.Types.ObjectId): Promise<IMood | null>;
  getMoodAnalytics(
    userId?: string | mongoose.Types.ObjectId,
    days?: number
  ): Promise<{
    averageMoodScore: number;
    moodDistribution: Record<string, number>;
    totalEntries: number;
    streak: number;
  }>;
  getTeamMoodAnalytics(department?: string): Promise<{
    averageMoodScore: number;
    moodDistribution: Record<string, number>;
    totalEntries: number;
    departmentBreakdown?: Record<string, any>;
  }>;
}

const moodSchema = new Schema<IMood, MoodModel>({
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
    maxlength: [500, 'Comment cannot exceed 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    
    default: () => {
      // Set to start of day in local timezone
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
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
moodSchema.index({ userId: 1, date: -1 });
moodSchema.index({ date: -1 });
moodSchema.index({ mood: 1, date: -1 });

// Unique constraint: one mood entry per user per day
moodSchema.index({ userId: 1, date: 1 }, { unique: true });

// Helper function to convert mood to numeric score
function moodToScore(mood: string): number {
  const scores = {
    'poor': 1,
    'not-great': 2,
    'okay': 3,
    'good': 4,
    'excellent': 5
  };
  return scores[mood as keyof typeof scores] || 3;
}

// Helper function to get start of day
function getStartOfDay(date?: Date): Date {
  const d = date || new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Static method to find moods by user ID
moodSchema.statics.findByUserId = function(
  userId: string | mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; startDate?: Date; endDate?: Date } = {}
) {
  const { limit = 30, skip = 0, startDate, endDate } = options;
  
  const query: any = { userId };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(startDate);
    if (endDate) query.date.$lte = getStartOfDay(endDate);
  }
  
  return this.find(query)
    .sort({ date: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get today's mood for a user
moodSchema.statics.getTodaysMood = function(userId: string | mongoose.Types.ObjectId) {
  const today = getStartOfDay();
  return this.findOne({ userId, date: today });
};

// Static method to get mood analytics for a user
moodSchema.statics.getMoodAnalytics = async function(
  userId?: string | mongoose.Types.ObjectId,
  days: number = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const query: any = { date: { $gte: getStartOfDay(startDate) } };
  if (userId) {
    query.userId = userId;
  }
  
  const moods = await this.find(query).sort({ date: -1 });
  
  if (moods.length === 0) {
    return {
      averageMoodScore: 0,
      moodDistribution: {},
      totalEntries: 0,
      streak: 0
    };
  }
  
  // Calculate average mood score
  const totalScore = moods.reduce((sum, mood) => sum + moodToScore(mood.mood), 0);
  const averageMoodScore = Number((totalScore / moods.length).toFixed(2));
  
  // Calculate mood distribution
  const moodDistribution: Record<string, number> = {};
  moods.forEach(mood => {
    moodDistribution[mood.mood] = (moodDistribution[mood.mood] || 0) + 1;
  });
  
  // Calculate streak (consecutive days with mood entries)
  let streak = 0;
  if (userId) {
    const userMoods = moods.filter(m => m.userId.toString() === userId.toString());
    const today = getStartOfDay();
    let currentDate = new Date(today);
    
    for (let i = 0; i < days; i++) {
      const hasEntry = userMoods.some(mood => 
        mood.date.getTime() === currentDate.getTime()
      );
      
      if (hasEntry) {
        streak++;
      } else {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }
  
  return {
    averageMoodScore,
    moodDistribution,
    totalEntries: moods.length,
    streak
  };
};

// Static method to get team mood analytics
moodSchema.statics.getTeamMoodAnalytics = async function(department?: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const pipeline: any[] = [
    {
      $match: {
        date: { $gte: getStartOfDay(thirtyDaysAgo) }
      }
    },
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
    }
  ];
  
  if (department) {
    pipeline.push({
      $match: {
        'user.department': department
      }
    });
  }
  
  const moods = await this.aggregate(pipeline);
  
  if (moods.length === 0) {
    return {
      averageMoodScore: 0,
      moodDistribution: {},
      totalEntries: 0
    };
  }
  
  // Calculate average mood score
  const totalScore = moods.reduce((sum: number, mood: any) => sum + moodToScore(mood.mood), 0);
  const averageMoodScore = Number((totalScore / moods.length).toFixed(2));
  
  // Calculate mood distribution
  const moodDistribution: Record<string, number> = {};
  moods.forEach((mood: any) => {
    moodDistribution[mood.mood] = (moodDistribution[mood.mood] || 0) + 1;
  });
  
  const result: any = {
    averageMoodScore,
    moodDistribution,
    totalEntries: moods.length
  };
  
  // Add department breakdown if not filtering by specific department
  if (!department) {
    const departmentBreakdown: Record<string, any> = {};
    moods.forEach((mood: any) => {
      const dept = mood.user.department;
      if (!departmentBreakdown[dept]) {
        departmentBreakdown[dept] = {
          totalEntries: 0,
          moodDistribution: {},
          scores: []
        };
      }
      
      departmentBreakdown[dept].totalEntries++;
      departmentBreakdown[dept].moodDistribution[mood.mood] = 
        (departmentBreakdown[dept].moodDistribution[mood.mood] || 0) + 1;
      departmentBreakdown[dept].scores.push(moodToScore(mood.mood));
    });
    
    // Calculate average for each department
    Object.keys(departmentBreakdown).forEach(dept => {
      const scores = departmentBreakdown[dept].scores;
      departmentBreakdown[dept].averageMoodScore = 
        Number((scores.reduce((a: number, b: number) => a + b, 0) / scores.length).toFixed(2));
      delete departmentBreakdown[dept].scores;
    });
    
    result.departmentBreakdown = departmentBreakdown;
  }
  
  return result;
};

export const Mood = mongoose.model<IMood, MoodModel>('Mood', moodSchema);
export default Mood;
