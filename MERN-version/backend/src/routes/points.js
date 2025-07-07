import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User, UserPoints, Transaction } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';
import CheerService from '../services/cheerService.js';

const router = Router();

// Get current user's points
router.get('/', requireAuth, async (req, res) => {
  try {
    // Get comprehensive cheer stats using the unified service
    const cheerStats = await CheerService.getUserCheerStats(req.user._id);
    
    if (!cheerStats.success) {
      // Fallback to basic points if cheer stats fail
      const userPoints = await UserPoints.findOne({ userId: req.user._id });
      
      if (!userPoints) {
        const newUserPoints = await UserPoints.createForUser(req.user._id);
        return res.json({
          availablePoints: newUserPoints.availablePoints,
          totalEarned: newUserPoints.totalEarned,
          totalSpent: newUserPoints.totalSpent,
          monthlyCheerLimit: newUserPoints.monthlyCheerLimit,
          monthlyCheerUsed: newUserPoints.monthlyCheerUsed
        });
      }

      return res.json({
        availablePoints: userPoints.availablePoints,
        totalEarned: userPoints.totalEarned,
        totalSpent: userPoints.totalSpent,
        monthlyCheerLimit: userPoints.monthlyCheerLimit,
        monthlyCheerUsed: userPoints.monthlyCheerUsed
      });
    }

    // Return the comprehensive stats from CheerService
    return res.json(cheerStats.data);
  } catch (error) {
    console.error('Points endpoint error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get points history (transactions)
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const type = req.query.type; // 'earned' | 'spent'

    // Build query to find transactions where user is either sender, receiver, or legacy userId
    // FILTER OUT DUPLICATE CHEER TRANSACTIONS: Only show 'given' for sender, only show 'received' for receiver
    const baseQuery = {
      $or: [
        // For transactions sent by this user (cheers given, purchases made)
        { 
          fromUserId: req.user._id,
          type: { $nin: ['received'] } // Don't show received transactions when user is the sender
        },
        // For transactions received by this user (cheers received)
        { 
          toUserId: req.user._id,
          type: { $nin: ['given'] } // Don't show given transactions when user is the receiver
        },
        // Support legacy transactions with userId field
        { 
          userId: req.user._id,
          fromUserId: { $exists: false },
          toUserId: { $exists: false }
        }
      ]
    };
    
    let query= baseQuery;
    
    if (type === 'earned') {
      query = {
        ...baseQuery,
        type: { $in: ['earned', 'received', 'bonus', 'refund', 'admin_grant'] }
      };
    } else if (type === 'spent') {
      query = {
        ...baseQuery,
        type: { $in: ['spent', 'given', 'purchase', 'admin_deduct'] }
      };
    }

    // Always exclude automatic distribution transactions
    query = {
      ...query,
      description: { 
        $not: { 
          $regex: 'Automatic point distribution|daily', 
          $options: 'i' 
        } 
      },
      'metadata.type': { $ne: 'automatic_distribution' }
    };

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('fromUserId', 'name email department')
      .populate('toUserId', 'name email department')
      .populate('userId', 'name email department');

    const total = await Transaction.countDocuments(query);

    return res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('History endpoint error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get points history (transactions) - alias for frontend compatibility
// Modified to only show cheer-related transactions (heartbits given/received)
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const type = req.query.type; // 'earned' | 'spent'

    // Build query to find transactions where user is either sender, receiver, or legacy userId
    // FILTER OUT DUPLICATE CHEER TRANSACTIONS: Only show 'given' for sender, only show 'received' for receiver
    const baseQuery = {
      $or: [
        // For transactions sent by this user (cheers given, purchases made)
        { 
          fromUserId: req.user._id,
          type: { $nin: ['received'] } // Don't show received transactions when user is the sender
        },
        // For transactions received by this user (cheers received)
        { 
          toUserId: req.user._id,
          type: { $nin: ['given'] } // Don't show given transactions when user is the receiver
        },
        // Support legacy transactions with userId field
        { 
          userId: req.user._id,
          fromUserId: { $exists: false },
          toUserId: { $exists: false }
        }
      ]
    };
    
    let query= baseQuery;
    
    if (type === 'earned') {
      query = {
        ...baseQuery,
        type: { $in: ['earned', 'received'] }
      };
    } else if (type === 'spent') {
      query = {
        ...baseQuery,
        type: { $in: ['spent', 'given'] }
      };
    }

    // Always exclude automatic distribution transactions
    query = {
      ...query,
      description: { 
        $not: { 
          $regex: 'Automatic point distribution|daily', 
          $options: 'i' 
        } 
      },
      'metadata.type': { $ne: 'automatic_distribution' }
    };

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('fromUserId', 'name email department')
      .populate('toUserId', 'name email department')
      .populate('userId', 'name email department');

    const total = await Transaction.countDocuments(query);

    return res.json({
      status: 'success',
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Transactions endpoint error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error',
      error: 'Failed to fetch transactions'
    });
  }
});

// Cheer a peer - Frontend compatible endpoint
router.post('/cheer', requireAuth, async (req, res) => {
  try {
    const { toUserId, amount, message } = req.body;
    const fromUserId = req.user._id;

    // Validation
    if (!toUserId || !validateObjectId(toUserId)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid recipient ID' 
      });
    }

    const pointsToSend = amount || 10; // Default to 10 points

    // Use the unified CheerService to process the cheer
    const result = await CheerService.processCheer(fromUserId, toUserId, pointsToSend, message);

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: result.message
      });
    }

    return res.json({
      status: 'success',
      message: result.message,
      data: result.data.transactions
    });
  } catch (error) {
    console.error('Cheer error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Send points to another user (cheer system)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { recipientId, amount, message } = req.body;
    const senderId = req.user._id;

    // Validation
    if (!recipientId || !validateObjectId(recipientId)) {
      return res.status(400).json({ message: 'Invalid recipient ID' });
    }

    if (!amount || amount <= 0 || amount > 100) {
      return res.status(400).json({ message: 'Amount must be between 1 and 100 points' });
    }

    if (senderId.toString() === recipientId) {
      return res.status(400).json({ message: 'Cannot send points to yourself' });
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.isActive) {
      return res.status(404).json({ message: 'Recipient not found or inactive' });
    }

    // Get sender's points
    const senderPoints = await UserPoints.findOne({ userId: senderId });
    if (!senderPoints) {
      return res.status(400).json({ message: 'Sender points record not found' });
    }

    // Check if sender has enough points
    if (senderPoints.availablePoints < amount) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Check monthly cheer limit
    const currentMonth = new Date();
    const lastReset = senderPoints.lastMonthlyReset;
    const isNewMonth = !lastReset || 
      lastReset.getMonth() !== currentMonth.getMonth() || 
      lastReset.getFullYear() !== currentMonth.getFullYear();

    if (isNewMonth) {
      senderPoints.monthlyCheerUsed = 0;
      senderPoints.lastMonthlyReset = currentMonth;
    }

    if (senderPoints.monthlyCheerUsed + amount > senderPoints.monthlyCheerLimit) {
      const remaining = senderPoints.monthlyCheerLimit - senderPoints.monthlyCheerUsed;
      return res.status(400).json({ 
        message: `Monthly cheer limit exceeded. You can send ${remaining} more points this month.` 
      });
    }

    // Get or create recipient's points
    let recipientPoints = await UserPoints.findOne({ userId: recipientId });
    if (!recipientPoints) {
      recipientPoints = await UserPoints.createForUser(recipientId);
    }

    // Start transaction
    const session = await UserPoints.startSession();
    session.startTransaction();

    try {
      // Update sender's points
      senderPoints.availablePoints -= amount;
      senderPoints.totalSpent += amount;
      senderPoints.monthlyCheerUsed += amount;
      await senderPoints.save({ session });

      // Update recipient's points
      if (recipientPoints) {
        recipientPoints.availablePoints += amount;
        recipientPoints.totalEarned += amount;
        await recipientPoints.save({ session });
      }

      // Create transaction records
      const senderTransaction = new Transaction({
        userId: senderId,
        type: 'spent',
        amount: -amount,
        description: `Sent points to ${recipient.name}`,
        metadata: {
          recipientId,
          recipientName: recipient.name,
          message: message || '',
          type: 'cheer'
        }
      });

      const recipientTransaction = new Transaction({
        userId: recipientId,
        type: 'earned',
        amount: amount,
        description: `Received points from ${req.user.name}`,
        metadata: {
          senderId,
          senderName: req.user.name,
          message: message || '',
          type: 'cheer'
        }
      });

      await senderTransaction.save({ session });
      await recipientTransaction.save({ session });

      await session.commitTransaction();

      return res.json({
        message: 'Points sent successfully',
        transaction: senderTransaction,
        newBalance: senderPoints.availablePoints
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Send points error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Add points to user
router.post('/admin/add', requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get or create user points
    let userPoints = await UserPoints.findOne({ userId });
    if (!userPoints) {
      userPoints = await UserPoints.createForUser(userId);
    }

    // Update points
    if (userPoints) {
      userPoints.availablePoints += amount;
      userPoints.totalEarned += amount;
      await userPoints.save();
    }

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'bonus',
      amount,
      description: reason || 'Admin bonus',
      metadata: {
        adminId: req.user._id,
        adminName: req.user.name,
        type: 'admin_bonus'
      }
    });

    await transaction.save();

    return res.json({
      message: 'Points added successfully',
      transaction,
      newBalance: userPoints?.availablePoints || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Deduct points from user
router.post('/admin/deduct', requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user points
    const userPoints = await UserPoints.findOne({ userId });
    if (!userPoints) {
      return res.status(404).json({ message: 'User points not found' });
    }

    if (userPoints.availablePoints < amount) {
      return res.status(400).json({ message: 'User has insufficient points' });
    }

    // Update points
    userPoints.availablePoints -= amount;
    userPoints.totalSpent += amount;
    await userPoints.save();

    // Create transaction record
    const transaction = new Transaction({
      userId,
      type: 'spent',
      amount: -amount,
      description: reason || 'Admin deduction',
      metadata: {
        adminId: req.user._id,
        adminName: req.user.name,
        type: 'admin_deduction'
      }
    });

    await transaction.save();

    return res.json({
      message: 'Points deducted successfully',
      transaction,
      newBalance: userPoints.availablePoints
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get user's points details
router.get('/admin/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('name email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPoints = await UserPoints.findOne({ userId });
    
    if (!userPoints) {
      return res.json({
        user,
        points: {
          availablePoints: 0,
          totalEarned: 0,
          totalSpent: 0,
          monthlyCheerLimit: 100,
          monthlyCheerUsed: 0
        }
      });
    }

    return res.json({
      user,
      points: {
        availablePoints: userPoints.availablePoints,
        totalEarned: userPoints.totalEarned,
        totalSpent: userPoints.totalSpent,
        monthlyCheerLimit: userPoints.monthlyCheerLimit,
        monthlyCheerUsed: userPoints.monthlyCheerUsed,
        lastMonthlyReset: userPoints.lastMonthlyReset
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Reset monthly cheer limits for all users
router.post('/admin/reset-monthly', requireAdmin, async (req, res) => {
  try {
    await UserPoints.resetMonthlyCheerUsage();
    
    return res.json({
      message: 'Monthly cheer limits reset for all users'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed cheer statistics
router.get('/cheer-stats', requireAuth, async (req, res) => {
  try {
    const cheerStats = await CheerService.getUserCheerStats(req.user._id);
    
    if (!cheerStats.success) {
      return res.status(500).json({
        status: 'error',
        message: cheerStats.message
      });
    }

    return res.json({
      status: 'success',
      data: cheerStats.data
    });
  } catch (error) {
    console.error('Cheer stats error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Get cheer history/transactions
router.get('/cheer-history', requireAuth, async (req, res) => {
  try {
    const { limit = 20, page = 1, type } = req.query;
    const skip = (page - 1) * limit;

    const history = await CheerService.getUserCheerHistory(req.user._id, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      type
    });

    if (!history.success) {
      return res.status(500).json({
        status: 'error',
        message: history.message
      });
    }

    return res.json({
      status: 'success',
      data: history.data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: history.pagination.total
      }
    });
  } catch (error) {
    console.error('Cheer history error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Get cheer leaderboard
router.get('/cheer-leaderboard', requireAuth, async (req, res) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;

    const leaderboard = await CheerService.getCheerLeaderboard(period, parseInt(limit));

    if (!leaderboard.success) {
      return res.status(500).json({
        status: 'error',
        message: leaderboard.message
      });
    }

    return res.json({
      status: 'success',
      data: leaderboard.data,
      period: leaderboard.period
    });
  } catch (error) {
    console.error('Cheer leaderboard error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Validate cheer request (for UI to check limits before sending)
router.post('/cheer-validate', requireAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    const pointsToSend = amount || 10;

    const validation = await CheerService.validateCheerRequest(req.user._id, pointsToSend);

    if (!validation.success) {
      return res.status(400).json({
        status: 'error',
        message: validation.message
      });
    }

    return res.json({
      status: 'success',
      data: validation.data
    });
  } catch (error) {
    console.error('Cheer validation error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

export default router;
