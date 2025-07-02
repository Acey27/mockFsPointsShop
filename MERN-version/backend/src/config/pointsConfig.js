/**
 * Points System Configuration
 * 
 * This file contains all configurable settings for the points distribution system.
 * Modify these values to adjust how and when points are distributed.
 */

export const pointsConfig = {
  // Points Distribution Settings
  distribution: {
    // How many points to give per distribution cycle
    pointsPerCycle: 5,
    
    // Cron schedule for automatic distribution
    // Examples:
    // '0 * * * *'     - Every hour (RECOMMENDED for production)
    // '*/5 * * * *'   - Every 5 minutes (good for testing)
    // '0 */2 * * *'   - Every 2 hours
    // '0 9,17 * * *'  - At 9 AM and 5 PM daily
    // '* * * * *'     - Every minute (WARNING: very intensive!)
    schedule: '0 * * * *',
    
    // Batch size for processing users (higher = faster but more memory usage)
    batchSize: 20,
    
    // Enable/disable verbose logging (set to false for production)
    verboseLogging: false
  },
  
  // Transaction Settings
  transaction: {
    // Default description for automatic point distributions
    description: 'Automatic point distribution',
    
    // Reason code for automatic distributions
    reason: 'system_reward',
    
    // Additional metadata to store with each transaction
    metadata: {
      type: 'automatic_distribution',
      source: 'scheduler'
    }
  },
  
  // Performance Settings
  performance: {
    // Maximum number of users to process in a single distribution cycle
    // (0 = no limit, but be careful with large user bases)
    maxUsersPerCycle: 0,
    
    // Delay between batches in milliseconds (helps reduce database load)
    batchDelay: 0
  }
};

/**
 * Development/Testing presets
 */
export const developmentPresets = {
  // Very frequent for testing (every minute)
  testing: {
    schedule: '* * * * *',
    pointsPerCycle: 1,
    verboseLogging: true,
    batchSize: 5
  },
  
  // Moderate for development (every 5 minutes)
  development: {
    schedule: '*/5 * * * *',
    pointsPerCycle: 3,
    verboseLogging: true,
    batchSize: 10
  },
  
  // Production settings (every hour)
  production: {
    schedule: '0 * * * *',
    pointsPerCycle: 5,
    verboseLogging: false,
    batchSize: 50
  }
};

/**
 * Apply a preset configuration
 */
export function applyPreset(presetName) {
  const preset = developmentPresets[presetName];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetName}. Available: ${Object.keys(developmentPresets).join(', ')}`);
  }
  
  Object.assign(pointsConfig.distribution, preset);
  console.log(`📋 Applied ${presetName} preset to points configuration`);
  
  return pointsConfig;
}
