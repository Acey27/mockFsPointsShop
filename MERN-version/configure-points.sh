#!/bin/bash

# Points Scheduler Configuration Script
# This script helps you quickly adjust the points distribution settings

BACKEND_DIR="/Users/zeanpalma/fs-points-shop/mockFsPointsShop/MERN-version/backend"
CONFIG_FILE="$BACKEND_DIR/src/config/pointsConfig.js"

echo "🔧 Points Scheduler Configuration Tool"
echo "======================================"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found: $BACKEND_DIR"
    exit 1
fi

echo ""
echo "Available presets:"
echo "1. testing    - Every minute (1 point, verbose logging)"
echo "2. development - Every 5 minutes (3 points, verbose logging)"  
echo "3. production - Every hour (5 points, minimal logging)"
echo "4. custom     - Manual configuration"
echo "5. show       - Show current configuration"
echo ""

read -p "Select an option (1-5): " choice

case $choice in
    1)
        echo "🧪 Setting TESTING configuration..."
        sed -i '' "s/schedule: '[^']*'/schedule: '* * * * *'/" "$CONFIG_FILE"
        sed -i '' "s/pointsPerCycle: [0-9]*/pointsPerCycle: 1/" "$CONFIG_FILE"
        sed -i '' "s/verboseLogging: [a-z]*/verboseLogging: true/" "$CONFIG_FILE"
        sed -i '' "s/batchSize: [0-9]*/batchSize: 5/" "$CONFIG_FILE"
        echo "✅ Testing configuration applied (every minute, 1 point)"
        ;;
    2)
        echo "🔨 Setting DEVELOPMENT configuration..."
        sed -i '' "s/schedule: '[^']*'/schedule: '*\/5 * * * *'/" "$CONFIG_FILE"
        sed -i '' "s/pointsPerCycle: [0-9]*/pointsPerCycle: 3/" "$CONFIG_FILE"
        sed -i '' "s/verboseLogging: [a-z]*/verboseLogging: true/" "$CONFIG_FILE"
        sed -i '' "s/batchSize: [0-9]*/batchSize: 10/" "$CONFIG_FILE"
        echo "✅ Development configuration applied (every 5 minutes, 3 points)"
        ;;
    3)
        echo "🚀 Setting PRODUCTION configuration..."
        sed -i '' "s/schedule: '[^']*'/schedule: '0 * * * *'/" "$CONFIG_FILE"
        sed -i '' "s/pointsPerCycle: [0-9]*/pointsPerCycle: 5/" "$CONFIG_FILE"
        sed -i '' "s/verboseLogging: [a-z]*/verboseLogging: false/" "$CONFIG_FILE"
        sed -i '' "s/batchSize: [0-9]*/batchSize: 50/" "$CONFIG_FILE"
        echo "✅ Production configuration applied (every hour, 5 points)"
        ;;
    4)
        echo "⚙️ Custom configuration:"
        echo ""
        echo "Cron schedule examples:"
        echo "  '* * * * *'     - Every minute"
        echo "  '*/5 * * * *'   - Every 5 minutes"
        echo "  '0 * * * *'     - Every hour"
        echo "  '0 */2 * * *'   - Every 2 hours"
        echo "  '0 9,17 * * *'  - At 9 AM and 5 PM"
        echo ""
        read -p "Enter cron schedule: " schedule
        read -p "Enter points per cycle: " points
        read -p "Enable verbose logging? (true/false): " verbose
        read -p "Enter batch size: " batch
        
        sed -i '' "s/schedule: '[^']*'/schedule: '$schedule'/" "$CONFIG_FILE"
        sed -i '' "s/pointsPerCycle: [0-9]*/pointsPerCycle: $points/" "$CONFIG_FILE"
        sed -i '' "s/verboseLogging: [a-z]*/verboseLogging: $verbose/" "$CONFIG_FILE"
        sed -i '' "s/batchSize: [0-9]*/batchSize: $batch/" "$CONFIG_FILE"
        echo "✅ Custom configuration applied"
        ;;
    5)
        echo "📋 Current configuration:"
        echo ""
        grep -A 15 "distribution: {" "$CONFIG_FILE" | head -16
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "⚠️  Remember to restart the backend server to apply changes!"
echo "💡 You can also edit the config manually at: $CONFIG_FILE"
