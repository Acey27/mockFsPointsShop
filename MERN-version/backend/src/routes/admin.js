import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User, UserPoints, Transaction, Product, Order, Mood } from '../models/index.js';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays } from 'date-fns';
import mongoose from 'mongoose';

const router = Router();

// Apply admin authentication to all routes
router.use(requireAuth);
router.use(requireAdmin);

// Dashboard Statistics
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    // User Statistics
    const totalUsers = await User.countDocuments();
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd }
    });
    const activeUsersThisWeek = await Transaction.distinct('userId', {
      createdAt: { $gte: weekStart, $lte: weekEnd }
    }).then(userIds => userIds.length);

    // Points Statistics
    const totalPointsEarned = await UserPoints.aggregate([
      { $group: { _id: null, total: { $sum: '$totalEarned' } } }
    ]).then(result => result[0]?.total || 0);

    const totalPointsSpent = await UserPoints.aggregate([
      { $group: { _id: null, total: { $sum: '$totalSpent' } } }
    ]).then(result => result[0]?.total || 0);

    const pointsEarnedThisMonth = await Transaction.aggregate([
      {
        $match: {
          type: 'earned',
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0);

    const pointsSpentThisMonth = await Transaction.aggregate([
      {
        $match: {
          type: 'spent',
          createdAt: { $gte: monthStart, $lte: monthEnd }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0);

    // Product Statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({ 
      inventory: { $lt: 10 },
      isActive: true 
    });

    // Order Statistics
    const totalOrders = await Order.countDocuments();
    const ordersThisMonth = await Order.countDocuments({
      createdAt: { $gte: monthStart, $lte: monthEnd }
    });
    const pendingOrders = await Order.countDocuments({ status: 'pending' });

    // Mood Statistics
    const totalMoodEntries = await Mood.countDocuments();
    const moodEntriesThisWeek = await Mood.countDocuments({
      createdAt: { $gte: weekStart, $lte: weekEnd }
    });

    // Recent activity (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    const recentTransactions = await Transaction.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentOrders = await Order.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentMoods = await Mood.find({
      createdAt: { $gte: sevenDaysAgo }
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisWeek: activeUsersThisWeek
      },
      points: {
        totalEarned: totalPointsEarned,
        totalSpent: totalPointsSpent,
        earnedThisMonth: pointsEarnedThisMonth,
        spentThisMonth: pointsSpentThisMonth,
        circulating: totalPointsEarned - totalPointsSpent
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        pending: pendingOrders
      },
      mood: {
        totalEntries: totalMoodEntries,
        entriesThisWeek: moodEntriesThisWeek
      },
      recentActivity: {
        transactions: recentTransactions,
        orders: recentOrders,
        moods: recentMoods
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
});

// User Management Overview
router.get('/users/overview', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get users with their points
    const users = await User.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'userpoints',
          localField: '_id',
          foreignField: 'userId',
          as: 'pointsData'
        }
      },
      {
        $addFields: {
          availablePoints: { $ifNull: [{ $arrayElemAt: ['$pointsData.availablePoints', 0] }, 0] },
          totalEarned: { $ifNull: [{ $arrayElemAt: ['$pointsData.totalEarned', 0] }, 0] },
          totalSpent: { $ifNull: [{ $arrayElemAt: ['$pointsData.totalSpent', 0] }, 0] }
        }
      },
      { $project: { password: 0, pointsData: 0 } },
      { $sort: { [sortBy]: sortOrder } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Admin users overview error:', error);
    res.status(500).json({ message: 'Failed to fetch users overview' });
  }
});

// Points Analytics
router.get('/analytics/points', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Daily points breakdown
    const dailyPoints = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          earned: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'earned'] }, '$total', 0]
            }
          },
          spent: {
            $sum: {
              $cond: [{ $eq: ['$_id.type', 'spent'] }, '$total', 0]
            }
          },
          transactions: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top earners
    const topEarners = await Transaction.aggregate([
      {
        $match: {
          type: 'earned',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          totalEarned: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
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
        $project: {
          totalEarned: 1,
          transactionCount: 1,
          user: { $arrayElemAt: ['$user', 0] }
        }
      },
      { $sort: { totalEarned: -1 } },
      { $limit: 10 }
    ]);

    // Points by category/reason
    const pointsByReason = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$reason',
          totalPoints: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalPoints: -1 } }
    ]);

    res.json({
      dailyPoints,
      topEarners,
      pointsByReason,
      period: {
        start: startDate,
        end: endDate,
        days
      }
    });
  } catch (error) {
    console.error('Admin points analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch points analytics' });
  }
});

// Mood Analytics
router.get('/analytics/mood', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Daily mood distribution
    const dailyMoods = await Mood.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            mood: '$mood'
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          moods: {
            $push: {
              mood: '$_id.mood',
              count: '$count'
            }
          },
          totalEntries: { $sum: '$count' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Overall mood distribution
    const moodDistribution = await Mood.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Average mood score over time
    const averageMoodOverTime = await Mood.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $addFields: {
          moodScore: {
            $switch: {
              branches: [
                { case: { $eq: ['$mood', 'terrible'] }, then: 1 },
                { case: { $eq: ['$mood', 'bad'] }, then: 2 },
                { case: { $eq: ['$mood', 'okay'] }, then: 3 },
                { case: { $eq: ['$mood', 'good'] }, then: 4 },
                { case: { $eq: ['$mood', 'excellent'] }, then: 5 }
              ],
              default: 3
            }
          }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          averageScore: { $avg: '$moodScore' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      dailyMoods,
      moodDistribution,
      averageMoodOverTime,
      period: {
        start: startDate,
        end: endDate,
        days
      }
    });
  } catch (error) {
    console.error('Admin mood analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch mood analytics' });
  }
});

// System Health Check
router.get('/system/health', async (req, res) => {
  try {
    const dbStats = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Mood.countDocuments(),
      UserPoints.countDocuments()
    ]);

    const [userCount, transactionCount, productCount, orderCount, moodCount, userPointsCount] = dbStats;

    // Check for recent activity (last 24 hours)
    const yesterday = subDays(new Date(), 1);
    const recentActivity = await Promise.all([
      Transaction.countDocuments({ createdAt: { $gte: yesterday } }),
      Order.countDocuments({ createdAt: { $gte: yesterday } }),
      Mood.countDocuments({ createdAt: { $gte: yesterday } })
    ]);

    const [recentTransactions, recentOrders, recentMoods] = recentActivity;

    res.json({
      status: 'healthy',
      database: {
        collections: {
          users: userCount,
          transactions: transactionCount,
          products: productCount,
          orders: orderCount,
          moods: moodCount,
          userPoints: userPointsCount
        },
        recentActivity: {
          transactions: recentTransactions,
          orders: recentOrders,
          moods: recentMoods
        }
      },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Admin system health error:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Database connection or query failed',
      timestamp: new Date()
    });
  }
});

// COMPREHENSIVE ADMIN TRANSACTION MANAGEMENT

// Get all transactions with advanced filtering and analytics
router.get('/transactions', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    
    const userId = req.query.userId;
    const type = req.query.type;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const minAmount = parseInt(req.query.minAmount) || 0;
    const maxAmount = parseInt(req.query.maxAmount) || 999999;
    const search = req.query.search;

    // Build query
    const query= {
      amount: { $gte: minAmount, $lte: maxAmount }
    };

    if (userId) {
      query.$or = [{ fromUserId: userId }, { toUserId: userId }];
    }

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    // Get transactions with user details
    const transactions = await Transaction.find(query)
      .populate('fromUserId', 'name email department avatar')
      .populate('toUserId', 'name email department avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(query);

    // Calculate analytics for current query
    const analytics = await Transaction.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    const totalAmountInQuery = await Transaction.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]).then(result => result[0]?.total || 0);

    res.json({
      status: 'success',
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      analytics: {
        totalAmount: totalAmountInQuery,
        breakdown: analytics,
        averageTransaction: total > 0 ? totalAmountInQuery / total : 0
      }
    });

  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions'
    });
  }
});

// Get detailed transaction by ID
router.get('/transactions/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await Transaction.findById(transactionId)
      .populate('fromUserId', 'name email department avatar role')
      .populate('toUserId', 'name email department avatar role');

    if (!transaction) {
      return res.status(404).json({
        status: 'error',
        message: 'Transaction not found'
      });
    }

    // Get related order if exists
    let relatedOrder= null;
    if (transaction.metadata?.orderId) {
      relatedOrder = await Order.findById(transaction.metadata.orderId)
        .populate('items.productId', 'name category')
        .populate('userId', 'name email');
    }

    // Get user's transaction history for context
    const userTransactions = await Transaction.find({
      $or: [
        { fromUserId: transaction.toUserId },
        { toUserId: transaction.toUserId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('fromUserId', 'name')
    .populate('toUserId', 'name');

    return res.json({
      status: 'success',
      data: {
        transaction,
        relatedOrder,
        userRecentTransactions: userTransactions
      }
    });

  } catch (error) {
    console.error('Admin transaction details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction details'
    });
  }
});

// Get all orders with receipts for admin monitoring
router.get('/orders', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    
    const userId = req.query.userId;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    const days = parseInt(req.query.days);
    const minAmount = parseInt(req.query.minAmount) || 0;
    const maxAmount = parseInt(req.query.maxAmount) || 999999;
    const search = req.query.search; // Add search parameter

    // Build query
    const query= {
      totalPoints: { $gte: minAmount, $lte: maxAmount }
    };

    if (userId) {
      query.userId = userId;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    } else if (days) {
      // Handle days parameter for date filtering
      const now = new Date();
      const daysAgo = subDays(now, days);
      query.createdAt = { $gte: daysAgo };
    }

    // Add search functionality - Build separate base query for aggregation
    const baseQuery = {
      totalPoints: { $gte: minAmount, $lte: maxAmount }
    };

    if (userId) {
      baseQuery.userId = new mongoose.Types.ObjectId(userId);
    }

    if (status) {
      baseQuery.status = status;
    }

    if (startDate || endDate) {
      baseQuery.createdAt = {};
      if (startDate) baseQuery.createdAt.$gte = new Date(startDate);
      if (endDate) baseQuery.createdAt.$lte = new Date(endDate);
    } else if (days) {
      // Handle days parameter for date filtering
      const now = new Date();
      const daysAgo = subDays(now, days);
      baseQuery.createdAt = { $gte: daysAgo };
    }

    let orders;
    if (search) {
      // If searching, we need to use aggregation to search in populated fields
      const searchMatchConditions = {
        ...baseQuery,
        $or: [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'userData.name': { $regex: search, $options: 'i' } },
          { 'userData.email': { $regex: search, $options: 'i' } },
          { 'productData.name': { $regex: search, $options: 'i' } }
        ]
      };

      orders = await Order.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productData'
          }
        },
        {
          $match: searchMatchConditions
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit }
      ]);

      // Convert aggregation results back to proper structure
      orders = orders.map(order => {
        const orderObj = {
          ...order,
          _id: order._id,
          userId: order.userData && order.userData[0] ? order.userData[0] : order.userId
        };
        
        // Fix items structure
        if (order.items && order.productData) {
          orderObj.items = order.items.map(item => {
            const productData = order.productData.find(p => p._id.toString() === item.productId.toString());
            return {
              ...item,
              productId: productData || item.productId
            };
          });
        }
        
        return orderObj;
      });
    } else {
      orders = await Order.find(baseQuery)
        .populate('items.productId', 'name description category pointsCost')
        .populate('userId', 'name email department avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
    }

    // Get accurate count for search results
    let total;
    if (search) {
      const countResult = await Order.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'userData'
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'items.productId',
            foreignField: '_id',
            as: 'productData'
          }
        },
        {
          $match: {
            ...baseQuery,
            $or: [
              { orderNumber: { $regex: search, $options: 'i' } },
              { 'userData.name': { $regex: search, $options: 'i' } },
              { 'userData.email': { $regex: search, $options: 'i' } },
              { 'productData.name': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $count: "total" }
      ]);
      total = countResult[0]?.total || 0;
    } else {
      total = await Order.countDocuments(baseQuery);
    }

    // Generate detailed receipts for admin view
    const ordersWithReceipts = orders.map(order => {
      // Handle both Mongoose documents and aggregation results
      const orderObj = order.toObject ? order.toObject() : order;
      const userObj = orderObj.userId;
      
      const receipt = {
        receiptId: `RCP-${order._id}`,
        orderNumber: orderObj.orderNumber || `ORD-${order._id}`,
        orderId: order._id,
        timestamp: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
        customer: {
          name: userObj?.name || 'Unknown',
          email: userObj?.email || 'Unknown',
          department: userObj?.department || 'Unknown',
          userId: userObj?._id || order.userId
        },
        items: order.items.map(item => {
          const productObj = item.productId;
          return {
            productId: productObj?._id || item.productId,
            productName: productObj?.name || 'Unknown Product',
            category: productObj?.category || 'Unknown',
            pointsCostPerItem: item.pointsCostPerItem,
            quantity: item.quantity,
            totalPoints: item.totalPoints
          };
        }),
        summary: {
          itemCount: order.items.length,
          totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          total: order.totalPoints
        },
        status: order.status,
        processedAt: orderObj.processedAt,
        shippingAddress: order.shippingAddress
      };

      return {
        ...orderObj,
        receipt
      };
    });

    // Calculate order analytics
    const orderAnalytics = await Order.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$totalPoints' },
          avgValue: { $avg: '$totalPoints' }
        }
      }
    ]);

    res.json({
      status: 'success',
      data: ordersWithReceipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      analytics: {
        breakdown: orderAnalytics
      }
    });

  } catch (error) {
    console.error('Admin orders error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get comprehensive user transaction history for admin
router.get('/users/:userId/transactions', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const userPoints = await UserPoints.findOne({ userId });

    // Get user's transactions
    const transactions = await Transaction.find({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    })
    .populate('fromUserId', 'name email department')
    .populate('toUserId', 'name email department')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await Transaction.countDocuments({
      $or: [{ fromUserId: userId }, { toUserId: userId }]
    });

    // Get user's orders
    const orders = await Order.find({ userId })
      .populate('items.productId', 'name category')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate user analytics
    const userAnalytics = await Transaction.aggregate([
      {
        $match: {
          $or: [
            { fromUserId: new mongoose.Types.ObjectId(userId) },
            { toUserId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    return res.json({
      status: 'success',
      data: {
        user: {
          ...user.toObject(),
          points: userPoints
        },
        transactions,
        orders,
        analytics: userAnalytics
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Admin user transactions error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user transactions'
    });
  }
});

// Advanced analytics dashboard for admins
router.get('/analytics/summary', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = subDays(new Date(), days);

    // Transaction trends
    const transactionTrends = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Top spending users
    const topSpenders = await UserPoints.find()
      .populate('userId', 'name email department')
      .sort({ totalSpent: -1 })
      .limit(10);

    // Top earning users
    const topEarners = await UserPoints.find()
      .populate('userId', 'name email department')
      .sort({ totalEarned: -1 })
      .limit(10);

    // Popular products
    const popularProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.totalPoints' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          productName: '$product.name',
          category: '$product.category',
          totalSold: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      status: 'success',
      data: {
        period: `${days} days`,
        transactionTrends,
        topSpenders,
        topEarners,
        popularProducts
      }
    });

  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics'
    });
  }
});

// Get orders with pending cancellation requests
router.get('/orders/cancellation-requests', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const orders = await Order.find({
      'cancellationRequest.requested': true,
      'cancellationRequest.adminResponse': 'pending'
    })
      .populate('userId', 'name email department')
      .populate('items.productId', 'name description image category pointsCost')
      .populate('cancellationRequest.requestedBy', 'name email department')
      .sort({ 'cancellationRequest.requestedAt': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments({
      'cancellationRequest.requested': true,
      'cancellationRequest.adminResponse': 'pending'
    });

    return res.json({
      status: 'success',
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get cancellation requests error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cancellation requests'
    });
  }
});

// Update order status (confirm/cancel by admin)
router.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, adminNotes = '' } = req.body;
    // const adminId = req.user._id; // Currently unused but kept for future audit functionality

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be "pending", "completed", or "cancelled"'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    const oldStatus = order.status;
    order.status = status;
    
    if (adminNotes) {
      order.notes = adminNotes;
    }

    // If changing to completed or cancelled, set processed timestamp
    if (status === 'completed' || status === 'cancelled') {
      order.processedAt = new Date();
    }

    // If cancelling an order, refund points
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      console.log(`Processing refund for cancelled order ${order.orderNumber}, amount: ${order.totalPoints} points`);

      // Refund points to user
      const userPoints = await UserPoints.findOne({ userId: order.userId });
      if (userPoints) {
        const oldBalance = userPoints.availablePoints;
        const oldTotalSpent = userPoints.totalSpent;
        
        userPoints.availablePoints += order.totalPoints;
        // Only subtract from totalSpent if it won't go negative
        userPoints.totalSpent = Math.max(0, userPoints.totalSpent - order.totalPoints);
        
        console.log(`Refunding points:
          - User ID: ${order.userId}
          - Old balance: ${oldBalance}
          - New balance: ${userPoints.availablePoints}
          - Old total spent: ${oldTotalSpent}
          - New total spent: ${userPoints.totalSpent}
          - Refund amount: ${order.totalPoints}`);
        
        await userPoints.save();

        // Create refund transaction
        const refundTransaction = new Transaction({
          userId: order.userId,
          type: 'refund',
          amount: order.totalPoints,
          description: `Refund for cancelled order ${order.orderNumber || order._id}`,
          metadata: {
            orderId: order._id,
            refundReason: 'Admin cancelled order'
          }
        });
        await refundTransaction.save();
        console.log(`Refund transaction created: ${refundTransaction._id}`);
      } else {
        console.error(`No UserPoints found for user ${order.userId}`);
      }

      // Restore product inventory
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.inventory !== null) {
          product.inventory += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('userId', 'name email department')
      .populate('items.productId', 'name description image category pointsCost');

    return res.json({
      status: 'success',
      message: `Order ${status} successfully`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
});

// Process cancellation request (approve/deny)
router.patch('/orders/:orderId/cancellation-request', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { action, adminNotes = '' } = req.body;
    const adminId = req.user._id;

    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid action. Must be "approve" or "deny"'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!order.cancellationRequest.requested) {
      return res.status(400).json({
        status: 'error',
        message: 'No cancellation request found for this order'
      });
    }

    if (order.cancellationRequest.adminResponse !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Cancellation request has already been processed'
      });
    }

    // Update cancellation request
    order.cancellationRequest.adminResponse = action === 'approve' ? 'approved' : 'denied';
    order.cancellationRequest.adminNotes = adminNotes.trim();
    order.cancellationRequest.processedAt = new Date();
    order.cancellationRequest.processedBy = adminId;

    // If approved, cancel the order and refund points
    if (action === 'approve') {
      order.status = 'cancelled';
      order.processedAt = new Date();

      console.log(`Processing refund for order ${order.orderNumber}, amount: ${order.totalPoints} points`);

      // Refund points to user
      const userPoints = await UserPoints.findOne({ userId: order.userId });
      if (userPoints) {
        const oldBalance = userPoints.availablePoints;
        const oldTotalSpent = userPoints.totalSpent;
        
        userPoints.availablePoints += order.totalPoints;
        // Only subtract from totalSpent if it won't go negative
        userPoints.totalSpent = Math.max(0, userPoints.totalSpent - order.totalPoints);
        
        console.log(`Refunding points:
          - User ID: ${order.userId}
          - Old balance: ${oldBalance}
          - New balance: ${userPoints.availablePoints}
          - Old total spent: ${oldTotalSpent}
          - New total spent: ${userPoints.totalSpent}
          - Refund amount: ${order.totalPoints}`);
        
        await userPoints.save();

        // Create refund transaction
        const refundTransaction = new Transaction({
          userId: order.userId,
          type: 'refund',
          amount: order.totalPoints,
          description: `Refund for cancelled order ${order.orderNumber || order._id}`,
          metadata: {
            orderId: order._id,
            refundReason: 'Admin approved cancellation request'
          }
        });
        await refundTransaction.save();
        console.log(`Refund transaction created: ${refundTransaction._id}`);
      } else {
        console.error(`No UserPoints found for user ${order.userId}`);
      }

      // Restore product inventory
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (product && product.inventory !== null) {
          product.inventory += item.quantity;
          await product.save();
        }
      }
    }

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('userId', 'name email department')
      .populate('items.productId', 'name description image category pointsCost')
      .populate('cancellationRequest.requestedBy', 'name email department')
      .populate('cancellationRequest.processedBy', 'name email department');

    return res.json({
      status: 'success',
      message: `Cancellation request ${action}d successfully`,
      data: updatedOrder
    });
  } catch (error) {
    console.error('Process cancellation request error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process cancellation request'
    });
  }
});

export default router;
