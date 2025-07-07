import cron from 'node-cron';
import { User, UserPoints, Transaction } from '../models/index.js';
import { pointsConfig } from '../config/pointsConfig.js';
import CheerService from './cheerService.js';

class PointsSchedulerService {
  constructor() {
    this.isRunning = false;
    this.task = null;
    this.cheerResetTask = null;
  }

  /**
   * Start the automatic points distribution scheduler
   * Uses configuration from pointsConfig
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Points scheduler is already running');
      return;
    }

    const { schedule, pointsPerCycle } = pointsConfig.distribution;
    
    this.task = cron.schedule(schedule, async () => {
      await this.distributePointsToAllUsers();
    }, {
      timezone: 'UTC'
    });

    // Add monthly cheer reset task (runs on the 1st of each month at 00:00)
    this.cheerResetTask = cron.schedule('0 0 1 * *', async () => {
      await this.resetMonthlyCheerUsage();
    }, {
      timezone: 'UTC'
    });

    this.task.start();
    this.cheerResetTask.start();
    this.isRunning = true;
    
    // Calculate next run description
    const scheduleInfo = this.getScheduleDescription(schedule);
    console.log(`✅ Points scheduler started - distributing ${pointsPerCycle} points ${scheduleInfo}`);
    console.log(`✅ Monthly cheer reset scheduler started - resets on 1st of each month at 00:00 UTC`);
  }

  /**
   * Get a human-readable description of the cron schedule
   */
  getScheduleDescription(schedule) {
    const scheduleMap = {
      '* * * * *': 'every minute (WARNING: very intensive!)',
      '*/5 * * * *': 'every 5 minutes',
      '0 * * * *': 'every hour',
      '0 */2 * * *': 'every 2 hours',
      '0 9,17 * * *': 'at 9 AM and 5 PM daily'
    };
    
    return scheduleMap[schedule] || `on schedule: ${schedule}`;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Points scheduler is not running');
      return;
    }

    if (this.task) {
      this.task.stop();
      this.task = null;
    }

    if (this.cheerResetTask) {
      this.cheerResetTask.stop();
      this.cheerResetTask = null;
    }

    this.isRunning = false;
    console.log('🛑 Points scheduler stopped');
  }

  /**
   * Reset monthly cheer usage for all users
   */
  async resetMonthlyCheerUsage() {
    try {
      console.log('🔄 Starting monthly cheer usage reset...');
      
      const result = await CheerService.resetMonthlyCheerUsage();
      
      if (result.success) {
        console.log('✅ Monthly cheer usage reset completed successfully');
      } else {
        console.error('❌ Monthly cheer usage reset failed:', result.message);
      }
    } catch (error) {
      console.error('❌ Error during monthly cheer usage reset:', error);
    }
  }

  /**
   * Check if the scheduler is currently running
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextRun: this.task ? new Date(Date.now() + 3600000) : undefined // Next hour
    };
  }

  /**
   * Manually trigger point distribution (for testing)
   */
  async manualDistribution() {
    try {
      const result = await this.distributePointsToAllUsers();
      return { success: true, usersUpdated: result.usersUpdated };
    } catch (error) {
      console.error('❌ Manual distribution failed:', error);
      return { 
        success: false, 
        usersUpdated: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Core function to distribute points to all active users
   */
  async distributePointsToAllUsers() {
    const startTime = Date.now();
    const errors = [];
    let usersUpdated = 0;

    try {
      console.log('🔄 Starting automatic point distribution...');

      // Get all active users
      const activeUsers = await User.find({ 
        isActive: true 
      }).select('_id name email');

      if (activeUsers.length === 0) {
        console.log('⚠️ No active users found for point distribution');
        return { usersUpdated: 0, errors: [] };
      }

      console.log(`📊 Processing ${activeUsers.length} active users for point distribution`);

      const { batchSize, maxUsersPerCycle, batchDelay } = pointsConfig.performance;
      const usersToProcess = maxUsersPerCycle > 0 
        ? activeUsers.slice(0, maxUsersPerCycle)
        : activeUsers;

      if (maxUsersPerCycle > 0 && activeUsers.length > maxUsersPerCycle) {
        console.log(`⚠️ Limited processing to ${maxUsersPerCycle} users (${activeUsers.length} total)`);
      }

      // Process users in batches to avoid overwhelming the database
      const actualBatchSize = batchSize || 20;
      for (let i = 0; i < usersToProcess.length; i += actualBatchSize) {
        const batch = usersToProcess.slice(i, i + actualBatchSize);
        
        try {
          await this.processBatch(batch);
          usersUpdated += batch.length;
          
          // Add delay between batches if configured
          if (batchDelay > 0 && i + actualBatchSize < usersToProcess.length) {
            await new Promise(resolve => setTimeout(resolve, batchDelay));
          }
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / actualBatchSize) + 1} failed: ${error}`;
          errors.push(errorMsg);
          console.error('❌', errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Point distribution completed in ${duration}ms`);
      console.log(`📈 Updated ${usersUpdated} users, ${errors.length} errors`);

      return { usersUpdated, errors };

    } catch (error) {
      const errorMsg = `Point distribution failed: ${error}`;
      console.error('❌', errorMsg);
      errors.push(errorMsg);
      return { usersUpdated, errors };
    }
  }

  /**
   * Process a batch of users for point distribution
   */
  async processBatch(users) {
    const promises = users.map(user => this.addPointsToUser(user));
    await Promise.all(promises);
  }

  /**
   * Add 5 points to a specific user
   */
  async addPointsToUser(user) {
    try {
      // Get or create user points record
      let userPoints = await UserPoints.findOne({ userId: user._id });
      
      if (!userPoints) {
        userPoints = await UserPoints.createForUser(user._id);
      }

      // Ensure userPoints exists before proceeding
      if (!userPoints) {
        throw new Error(`Failed to create or find points record for user ${user._id}`);
      }

      // Add points based on configuration
      const pointsToAdd = pointsConfig.distribution.pointsPerCycle;
      userPoints.availablePoints += pointsToAdd;
      userPoints.totalEarned += pointsToAdd;
      await userPoints.save();

      // Create transaction record
      await Transaction.create({
        toUserId: user._id, // Set toUserId since this is points going TO the user
        type: 'earned',
        amount: pointsToAdd,
        description: pointsConfig.transaction.description,
        reason: pointsConfig.transaction.reason,
        metadata: {
          ...pointsConfig.transaction.metadata,
          timestamp: new Date()
        }
      });

      // Log based on configuration
      const { verboseLogging } = pointsConfig.distribution;
      if (verboseLogging || user._id.toString().slice(-1) === '0') {
        console.log(`💰 Added ${pointsToAdd} points to ${user.name} (${user.email})`);
      }

    } catch (error) {
      console.error(`❌ Failed to add points to ${user.name}:`, error);
      throw error;
    }
  }

  /**
   * Get distribution statistics
   */
  async getStats() {
    try {
      const activeUsers = await User.countDocuments({ isActive: true });
      
      // Get today's automatic distributions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayDistributions = await Transaction.aggregate([
        {
          $match: {
            'metadata.type': 'automatic_distribution',
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const totalPointsToday = todayDistributions[0]?.totalPoints || 0;

      // Get last distribution time
      const lastDistribution = await Transaction.findOne(
        { 'metadata.type': 'automatic_distribution' },
        {},
        { sort: { createdAt: -1 } }
      );

      return {
        totalUsersEligible: activeUsers,
        totalPointsDistributedToday: totalPointsToday,
        lastDistribution: lastDistribution?.createdAt,
        nextDistribution: this.isRunning ? new Date(Date.now() + 3600000) : undefined
      };
    } catch (error) {
      console.error('❌ Failed to get distribution stats:', error);
      throw error;
    }
  }
}

export const pointsScheduler = new PointsSchedulerService();
