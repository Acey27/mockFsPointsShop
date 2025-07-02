import cron, { ScheduledTask } from 'node-cron';
import { User, UserPoints, Transaction } from '../models/index.js';

class PointsSchedulerService {
  private isRunning = false;
  private task: ScheduledTask | null = null;

  /**
   * Start the automatic points distribution scheduler
   * Distributes 5 points to all active users every minute
   */
  public start(): void {
    if (this.isRunning) {
      console.log('⚠️ Points scheduler is already running');
      return;
    }

    // Schedule to run every minute: '* * * * *'
    // For testing, you might want to use a shorter interval
    this.task = cron.schedule('* * * * *', async () => {
      await this.distributePointsToAllUsers();
    }, {
      timezone: 'UTC'
    });

    this.task.start();
    this.isRunning = true;
    console.log('✅ Points scheduler started - distributing 5 points per minute to all users');
  }

  /**
   * Stop the automatic points distribution scheduler
   */
  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
    }
    this.isRunning = false;
    console.log('🛑 Points scheduler stopped');
  }

  /**
   * Check if the scheduler is currently running
   */
  public getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.task ? new Date(Date.now() + 60000) : undefined // Next minute
    };
  }

  /**
   * Manually trigger point distribution (for testing)
   */
  public async manualDistribution(): Promise<{ success: boolean; usersUpdated: number; error?: string }> {
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
  private async distributePointsToAllUsers(): Promise<{ usersUpdated: number; errors: string[] }> {
    const startTime = Date.now();
    const errors: string[] = [];
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

      console.log(`📊 Found ${activeUsers.length} active users for point distribution`);

      // Process users in batches to avoid overwhelming the database
      const batchSize = 10;
      for (let i = 0; i < activeUsers.length; i += batchSize) {
        const batch = activeUsers.slice(i, i + batchSize);
        
        try {
          await this.processBatch(batch);
          usersUpdated += batch.length;
        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`;
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
  private async processBatch(users: any[]): Promise<void> {
    const promises = users.map(user => this.addPointsToUser(user));
    await Promise.all(promises);
  }

  /**
   * Add 5 points to a specific user
   */
  private async addPointsToUser(user: any): Promise<void> {
    try {
      // Get or create user points record
      let userPoints = await UserPoints.findOne({ userId: user._id });
      
      if (!userPoints) {
        userPoints = await UserPoints.createForUser(user._id) as any;
      }

      // Ensure userPoints exists before proceeding
      if (!userPoints) {
        throw new Error(`Failed to create or find points record for user ${user._id}`);
      }

      // Add 5 points
      const pointsToAdd = 5;
      userPoints.availablePoints += pointsToAdd;
      userPoints.totalEarned += pointsToAdd;
      await userPoints.save();

      // Create transaction record
      await Transaction.create({
        toUserId: user._id, // Set toUserId since this is points going TO the user
        type: 'earned',
        amount: pointsToAdd,
        description: 'Automatic point distribution',
        reason: 'system_reward',
        metadata: {
          type: 'automatic_distribution',
          timestamp: new Date(),
          source: 'scheduler'
        }
      });

      console.log(`💰 Added ${pointsToAdd} points to ${user.name} (${user.email})`);

    } catch (error) {
      console.error(`❌ Failed to add points to ${user.name}:`, error);
      throw error;
    }
  }

  /**
   * Get distribution statistics
   */
  public async getStats(): Promise<{
    totalUsersEligible: number;
    totalPointsDistributedToday: number;
    lastDistribution?: Date;
    nextDistribution?: Date;
  }> {
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
        nextDistribution: this.isRunning ? new Date(Date.now() + 60000) : undefined
      };
    } catch (error) {
      console.error('❌ Failed to get distribution stats:', error);
      throw error;
    }
  }
}

export const pointsScheduler = new PointsSchedulerService();
