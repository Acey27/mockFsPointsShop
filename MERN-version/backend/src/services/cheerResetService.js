import CheerService from './cheerService.js';

class CheerResetService {
  constructor() {
    this.isRunning = false;
    this.cheerResetTask = null;
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
   * Start the monthly cheer reset scheduler (optional - could be run as a cron job instead)
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Cheer reset scheduler is already running');
      return;
    }

    // Note: This would require re-adding node-cron if you want automated monthly resets
    // For now, this can be called manually or via external cron job
    console.log('💡 Monthly cheer reset service initialized (manual execution mode)');
    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Cheer reset scheduler is not running');
      return;
    }

    if (this.cheerResetTask) {
      this.cheerResetTask.stop();
      this.cheerResetTask = null;
    }

    this.isRunning = false;
    console.log('🛑 Cheer reset scheduler stopped');
  }

  /**
   * Get the status of the service
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      type: 'manual_execution'
    };
  }
}

export const cheerResetService = new CheerResetService();
