import { User, UserPoints, Transaction } from '../models/index.js';

/**
 * Unified Cheer Service
 * 
 * This service provides a single interface for all cheer-related operations,
 * ensuring consistency between the UI requirements and backend data.
 */
class CheerService {
  /**
   * Process a cheer transaction between two users
   */
  static async processCheer(fromUserId, toUserId, amount, message) {
    try {
      // Validate inputs
      if (!fromUserId || !toUserId || !amount) {
        throw new Error('Missing required parameters: fromUserId, toUserId, amount');
      }

      if (amount <= 0 || amount > 100) {
        throw new Error('Amount must be between 1 and 100 points');
      }

      if (fromUserId.toString() === toUserId.toString()) {
        throw new Error('Cannot send points to yourself');
      }

      // Check if recipient exists and is active
      const recipient = await User.findById(toUserId);
      if (!recipient || !recipient.isActive) {
        throw new Error('Recipient not found or inactive');
      }

      // Use the UserPoints static method to handle the transaction
      const result = await UserPoints.processCheerTransaction(fromUserId, toUserId, amount, message);

      return {
        success: true,
        message: `Successfully cheered ${recipient.name} with ${amount} points!`,
        data: {
          senderPoints: result.senderPoints,
          recipientPoints: result.recipientPoints,
          transactions: result.transactions
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get comprehensive cheer statistics for a user
   */
  static async getUserCheerStats(userId) {
    try {
      const stats = await UserPoints.getCheerStats(userId);
      
      // Add some derived calculations for UI convenience
      const heartbitsRemaining = stats.monthlyCheerLimit - stats.monthlyCheerUsed;
      const heartbitsUsedPercentage = Math.round((stats.monthlyCheerUsed / stats.monthlyCheerLimit) * 100);

      return {
        success: true,
        data: {
          ...stats,
          // UI-friendly derived values
          heartbitsRemaining,
          heartbitsUsedPercentage,
          canSendCheers: heartbitsRemaining > 0,
          
          // For backward compatibility with existing UI
          remainingPoints: heartbitsRemaining,
          pointsGivenThisMonth: stats.monthlyCheerUsed, // Use the authoritative source
          totalHeartBits: stats.totalHeartBitsReceived
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get recent cheer transactions for a user
   */
  static async getUserCheerHistory(userId, options = {}) {
    try {
      const { limit = 20, skip = 0, type } = options;
      
      const transactions = await Transaction.getCheerTransactions(userId, { limit, skip, type });
      
      return {
        success: true,
        data: transactions,
        pagination: {
          limit,
          skip,
          total: transactions.length
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get monthly cheer statistics
   */
  static async getMonthlyCheerStats(userId, year = null, month = null) {
    try {
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || (now.getMonth() + 1);

      const stats = await Transaction.getMonthlyCheerStats(userId, targetYear, targetMonth);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Get cheer leaderboard for a given period
   */
  static async getCheerLeaderboard(period = 'monthly', limit = 10) {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'weekly': {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          startDate = startOfWeek;
          break;
        }
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'alltime':
          startDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const leaderboard = await Transaction.aggregate([
        {
          $match: {
            type: 'received',
            'metadata.transactionType': 'cheer',
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: '$toUserId',
            totalPoints: { $sum: '$amount' },
            cheerCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 1,
            name: '$user.name',
            department: '$user.department',
            avatar: '$user.avatar',
            totalPoints: 1,
            cheerCount: 1
          }
        },
        {
          $sort: { totalPoints: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return {
        success: true,
        data: leaderboard,
        period
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Reset monthly cheer usage for all users (scheduled task)
   */
  static async resetMonthlyCheerUsage() {
    try {
      await UserPoints.resetMonthlyCheerUsage();
      
      return {
        success: true,
        message: 'Monthly cheer usage reset successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Validate cheer limits and availability
   */
  static async validateCheerRequest(fromUserId, amount) {
    try {
      const senderPoints = await UserPoints.findOne({ userId: fromUserId });
      if (!senderPoints) {
        throw new Error('Sender points record not found');
      }

      // Check and handle monthly reset
      const currentMonth = new Date();
      const lastReset = senderPoints.lastMonthlyReset;
      const isNewMonth = !lastReset || 
        lastReset.getMonth() !== currentMonth.getMonth() || 
        lastReset.getFullYear() !== currentMonth.getFullYear();

      let availableAmount = senderPoints.monthlyCheerLimit - senderPoints.monthlyCheerUsed;
      
      if (isNewMonth) {
        availableAmount = senderPoints.monthlyCheerLimit; // Full limit available
      }

      const canSend = availableAmount >= amount;
      
      return {
        success: true,
        data: {
          canSend,
          availableAmount,
          requestedAmount: amount,
          monthlyLimit: senderPoints.monthlyCheerLimit,
          monthlyUsed: isNewMonth ? 0 : senderPoints.monthlyCheerUsed,
          isNewMonth
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }
}

export default CheerService;
