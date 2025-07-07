import { database } from '../src/config/database.js';
import { User, Cheer } from '../src/models/index.js';

// Comprehensive cheer messages categorized by type
const cheerMessages = {
  achievement: [
    "Congratulations on crushing that deadline! Your efficiency is incredible.",
    "Amazing work on the project launch - you really went above and beyond!",
    "Your presentation was absolutely outstanding. Well done!",
    "You've really mastered that new technology. Impressive!",
    "Your solution to that complex problem was brilliant.",
    "Outstanding performance this quarter. Keep up the excellent work!",
    "Your leadership on this project has been exceptional.",
    "The way you handled that client meeting was professional and impressive.",
    "Your code review feedback has made our entire codebase better.",
    "Fantastic job on hitting all your targets this month!"
  ],
  collaboration: [
    "Thanks for always being willing to help others. You're a true team player!",
    "Your collaboration across departments has been invaluable.",
    "I love how you always make time to mentor junior team members.",
    "Your knowledge sharing in team meetings is so helpful.",
    "Thanks for jumping in to help when we were swamped. You saved the day!",
    "Your cross-team coordination skills are exceptional.",
    "You make working together so much easier and more enjoyable.",
    "Thanks for always being available for pair programming sessions.",
    "Your willingness to share expertise has helped everyone grow.",
    "You're the glue that holds our team together!"
  ],
  innovation: [
    "Your creative approach to this challenge is inspiring!",
    "I love how you always think outside the box.",
    "Your innovative solution just saved us hours of work.",
    "The new process you suggested is already making a huge difference.",
    "Your fresh perspective on this problem was exactly what we needed.",
    "You consistently bring new ideas that move us forward.",
    "Your experimental approach led to a breakthrough discovery!",
    "The tool you built is being used by teams across the company.",
    "Your automation script is a game-changer for our workflow.",
    "You never stop finding ways to improve how we work."
  ],
  support: [
    "Thank you for being such a reliable and dependable colleague.",
    "Your positive attitude always brightens everyone's day.",
    "Thanks for being patient and understanding during that stressful period.",
    "You're always there when someone needs help or guidance.",
    "Your encouragement helped me push through a tough challenge.",
    "Thanks for covering for me when I was out. Much appreciated!",
    "Your empathy and understanding make you an amazing teammate.",
    "You create such a welcoming environment for new team members.",
    "Thanks for always listening and providing thoughtful feedback.",
    "Your support during the project crisis was invaluable."
  ],
  quality: [
    "Your attention to detail is absolutely meticulous and impressive.",
    "The quality of your work consistently exceeds expectations.",
    "Your thorough testing prevented several major issues.",
    "You never compromise on quality, and it shows in everything you do.",
    "Your code is always clean, well-documented, and maintainable.",
    "The documentation you wrote is crystal clear and comprehensive.",
    "Your design work is both beautiful and highly functional.",
    "You catch edge cases that others miss. Your QA skills are top-notch!",
    "Your commitment to excellence raises the bar for everyone.",
    "The standards you set inspire the whole team to do better."
  ],
  communication: [
    "Your clear communication made that complex topic easy to understand.",
    "Thanks for keeping everyone informed throughout the project.",
    "Your meeting facilitation skills are excellent.",
    "You explain technical concepts in such an accessible way.",
    "Your written updates are always comprehensive and well-organized.",
    "Thanks for asking the right questions that got us unstuck.",
    "Your feedback is always constructive and actionable.",
    "You're great at building consensus among different stakeholders.",
    "Your presentation skills continue to impress clients and colleagues.",
    "You have a gift for translating business needs into technical requirements."
  ]
};

// Department-specific achievements
const departmentSpecificMessages = {
  Engineering: [
    "Your code architecture is elegant and scalable.",
    "The performance optimization you implemented is incredible!",
    "Your debugging skills saved us from a major production issue.",
    "Your API design is intuitive and well-documented.",
    "The refactoring you did made the codebase so much cleaner."
  ],
  Design: [
    "Your user interface design is both beautiful and intuitive.",
    "The user experience you created exceeds all expectations.",
    "Your design system has improved consistency across all products.",
    "Your prototypes perfectly communicate the vision.",
    "The visual identity you developed is stunning and memorable."
  ],
  Marketing: [
    "Your campaign generated amazing engagement numbers!",
    "The content strategy you developed is spot-on.",
    "Your market analysis provided crucial insights for our roadmap.",
    "The brand messaging you crafted really resonates with our audience.",
    "Your social media strategy has significantly boosted our presence."
  ],
  Sales: [
    "Congratulations on closing that major deal!",
    "Your client relationship building skills are exceptional.",
    "You consistently exceed your sales targets.",
    "Your product knowledge helps close complex deals.",
    "The way you handle objections is masterful."
  ],
  HR: [
    "Your onboarding process makes new hires feel welcome immediately.",
    "Thank you for always being available to help resolve conflicts.",
    "Your training programs have significantly improved team skills.",
    "You create a positive workplace culture that everyone appreciates.",
    "Your talent acquisition skills bring amazing people to our team."
  ]
};

// Generate time-distributed cheers
const generateCheerData = (users, timeRange, count) => {
  const cheers = [];
  const now = new Date();
  const allMessages = Object.values(cheerMessages).flat();
  
  for (let i = 0; i < count; i++) {
    const fromUser = users[Math.floor(Math.random() * users.length)];
    let toUser = users[Math.floor(Math.random() * users.length)];
    
    // Ensure different users
    while (fromUser._id.equals(toUser._id)) {
      toUser = users[Math.floor(Math.random() * users.length)];
    }
    
    // Select message type based on probability
    let message;
    const messageType = Math.random();
    
    if (messageType < 0.15 && departmentSpecificMessages[toUser.department]) {
      // 15% chance for department-specific message
      const deptMessages = departmentSpecificMessages[toUser.department];
      message = deptMessages[Math.floor(Math.random() * deptMessages.length)];
    } else {
      // Regular categorized message
      const categories = Object.keys(cheerMessages);
      const category = categories[Math.floor(Math.random() * categories.length)];
      const categoryMessages = cheerMessages[category];
      message = categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
    }
    
    // Generate points (weighted towards lower values)
    let points;
    const pointsRandom = Math.random();
    if (pointsRandom < 0.4) points = 1;      // 40% chance for 1 point
    else if (pointsRandom < 0.7) points = 2; // 30% chance for 2 points
    else if (pointsRandom < 0.85) points = 3; // 15% chance for 3 points
    else if (pointsRandom < 0.95) points = 4; // 10% chance for 4 points
    else points = 5;                          // 5% chance for 5 points
    
    // Generate timestamp within range
    let createdAt;
    switch (timeRange) {
      case 'today':
        createdAt = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
        break;
      case 'week':
        createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        createdAt = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        createdAt = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        createdAt = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        createdAt = new Date(now.getTime() - Math.random() * timeRange * 24 * 60 * 60 * 1000);
    }
    
    cheers.push({
      fromUser: fromUser._id,
      toUser: toUser._id,
      message,
      points,
      createdAt
    });
  }
  
  return cheers;
};

// Generate trending patterns (some users get more cheers)
const generateTrendingCheers = (users, count) => {
  const cheers = [];
  const now = new Date();
  
  // Select 3-5 "trending" users who will receive more cheers
  const trendingUsers = users.slice(0, Math.min(5, Math.floor(users.length * 0.3)));
  const regularUsers = users.slice(5);
  
  for (let i = 0; i < count; i++) {
    const fromUser = users[Math.floor(Math.random() * users.length)];
    
    // 60% chance to cheer a trending user, 40% for regular users
    let toUser;
    if (Math.random() < 0.6 && trendingUsers.length > 0) {
      toUser = trendingUsers[Math.floor(Math.random() * trendingUsers.length)];
    } else {
      toUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
    }
    
    // Ensure different users
    while (fromUser._id.equals(toUser._id)) {
      toUser = users[Math.floor(Math.random() * users.length)];
    }
    
    const allMessages = Object.values(cheerMessages).flat();
    const message = allMessages[Math.floor(Math.random() * allMessages.length)];
    const points = Math.floor(Math.random() * 5) + 1;
    
    // Recent cheers (last 7 days)
    const createdAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    
    cheers.push({
      fromUser: fromUser._id,
      toUser: toUser._id,
      message,
      points,
      createdAt
    });
  }
  
  return cheers;
};

const seedCheers = async (options = {}) => {
  const {
    clearExisting = true,
    todayCount = 8,
    weekCount = 25,
    monthCount = 50,
    quarterCount = 100,
    yearCount = 200,
    trendingCount = 30,
    verbose = true
  } = options;
  
  try {
    await database.connect();
    
    if (verbose) {
      console.log('🎉 Starting comprehensive cheer seeding...\n');
    }
    
    // Get all users
    const users = await User.find({});
    if (users.length === 0) {
      throw new Error('No users found. Please run the main seed script first.');
    }
    
    if (verbose) {
      console.log(`👥 Found ${users.length} users in database`);
    }
    
    // Clear existing cheers if requested
    if (clearExisting) {
      const deletedCount = await Cheer.countDocuments();
      await Cheer.deleteMany({});
      if (verbose) {
        console.log(`🗑️  Cleared ${deletedCount} existing cheers`);
      }
    }
    
    const allCheers = [];
    
    // Generate different time period cheers
    if (verbose) console.log('\n📅 Generating time-distributed cheers...');
    
    if (todayCount > 0) {
      const todayCheers = generateCheerData(users, 'today', todayCount);
      allCheers.push(...todayCheers);
      if (verbose) console.log(`  ✓ Today: ${todayCount} cheers`);
    }
    
    if (weekCount > 0) {
      const weekCheers = generateCheerData(users, 'week', weekCount);
      allCheers.push(...weekCheers);
      if (verbose) console.log(`  ✓ This week: ${weekCount} cheers`);
    }
    
    if (monthCount > 0) {
      const monthCheers = generateCheerData(users, 'month', monthCount);
      allCheers.push(...monthCheers);
      if (verbose) console.log(`  ✓ This month: ${monthCount} cheers`);
    }
    
    if (quarterCount > 0) {
      const quarterCheers = generateCheerData(users, 'quarter', quarterCount);
      allCheers.push(...quarterCheers);
      if (verbose) console.log(`  ✓ This quarter: ${quarterCount} cheers`);
    }
    
    if (yearCount > 0) {
      const yearCheers = generateCheerData(users, 'year', yearCount);
      allCheers.push(...yearCheers);
      if (verbose) console.log(`  ✓ This year: ${yearCount} cheers`);
    }
    
    // Generate trending cheers
    if (trendingCount > 0) {
      if (verbose) console.log('\n🔥 Generating trending cheers...');
      const trendingCheers = generateTrendingCheers(users, trendingCount);
      allCheers.push(...trendingCheers);
      if (verbose) console.log(`  ✓ Trending: ${trendingCount} cheers`);
    }
    
    // Insert all cheers
    if (verbose) console.log('\n💾 Inserting cheers into database...');
    
    // Sort by creation date for better database performance
    allCheers.sort((a, b) => a.createdAt - b.createdAt);
    
    // Insert in batches to avoid memory issues
    const batchSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < allCheers.length; i += batchSize) {
      const batch = allCheers.slice(i, i + batchSize);
      await Cheer.insertMany(batch);
      insertedCount += batch.length;
      
      if (verbose && allCheers.length > batchSize) {
        process.stdout.write(`\r  Progress: ${insertedCount}/${allCheers.length} cheers inserted`);
      }
    }
    
    if (verbose) {
      console.log(`\n\n✅ Successfully created ${allCheers.length} cheers!`);
      
      // Display statistics
      console.log('\n📊 Cheer Statistics:');
      
      const stats = await Promise.all([
        Cheer.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Cheer.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
        Cheer.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
        Cheer.countDocuments({}),
        Cheer.aggregate([{ $group: { _id: null, totalPoints: { $sum: '$points' } } }])
      ]);
      
      console.log(`  📅 Last 24 hours: ${stats[0]} cheers`);
      console.log(`  📅 Last 7 days: ${stats[1]} cheers`);
      console.log(`  📅 Last 30 days: ${stats[2]} cheers`);
      console.log(`  📅 Total: ${stats[3]} cheers`);
      console.log(`  🎯 Total points distributed: ${stats[4][0]?.totalPoints || 0} points`);
      
      // Top cheerleaders
      console.log('\n🏆 Top Cheerleaders (most cheers given):');
      const topCheerleaders = await Cheer.aggregate([
        { $group: { _id: '$fromUser', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      topCheerleaders.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.user.name}: ${item.count} cheers, ${item.totalPoints} points given`);
      });
      
      // Top cheer recipients
      console.log('\n🌟 Top Cheer Recipients (most cheers received):');
      const topRecipients = await Cheer.aggregate([
        { $group: { _id: '$toUser', count: { $sum: 1 }, totalPoints: { $sum: '$points' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
      
      topRecipients.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.user.name}: ${item.count} cheers, ${item.totalPoints} points received`);
      });
    }
    
    return {
      totalCheers: allCheers.length,
      breakdown: {
        today: todayCount,
        week: weekCount,
        month: monthCount,
        quarter: quarterCount,
        year: yearCount,
        trending: trendingCount
      }
    };
    
  } catch (error) {
    console.error('❌ Error seeding cheers:', error);
    throw error;
  } finally {
    await database.disconnect();
    if (verbose) {
      console.log('\n👋 Disconnected from database');
    }
  }
};

// CLI support
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value !== undefined) {
      if (key === 'clearExisting' || key === 'verbose') {
        options[key] = value.toLowerCase() === 'true';
      } else if (['todayCount', 'weekCount', 'monthCount', 'quarterCount', 'yearCount', 'trendingCount'].includes(key)) {
        options[key] = parseInt(value) || 0;
      }
    }
  }
  
  console.log('🚀 Running cheer seeding script...');
  if (Object.keys(options).length > 0) {
    console.log('📋 Options:', options);
  }
  
  seedCheers(options)
    .then((result) => {
      console.log('\n🎊 Cheer seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cheer seeding failed:', error.message);
      process.exit(1);
    });
}

export { seedCheers };
export default seedCheers;
