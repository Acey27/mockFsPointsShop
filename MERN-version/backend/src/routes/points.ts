import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User, UserPoints, Transaction } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';

const router = Router();

// Get current user's points
router.get('/', requireAuth, async (req, res) => {
  try {
    const userPoints = await UserPoints.findOne({ userId: req.user!._id });
    
    if (!userPoints) {
      // Create points record if it doesn't exist
      const newUserPoints = await UserPoints.createForUser(req.user!._id);
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
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get points history (transactions)
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const type = req.query.type as string; // 'earned' | 'spent'

    let query: any = { userId: req.user!._id };
    
    if (type === 'earned') {
      query.type = { $in: ['earned', 'bonus', 'refund'] };
    } else if (type === 'spent') {
      query.type = { $in: ['spent', 'purchase'] };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrderId', 'orderNumber status')
      .populate('relatedProductId', 'name');

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
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get points history (transactions) - alias for frontend compatibility
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const type = req.query.type as string; // 'earned' | 'spent'

    let query: any = { userId: req.user!._id };
    
    if (type === 'earned') {
      query.type = { $in: ['earned', 'bonus', 'refund'] };
    } else if (type === 'spent') {
      query.type = { $in: ['spent', 'purchase'] };
    }

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('relatedOrderId', 'orderNumber status')
      .populate('relatedProductId', 'name');

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
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error',
      error: 'Failed to fetch transactions'
    });
  }
});

// Send points to another user (cheer system)
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { recipientId, amount, message } = req.body;
    const senderId = req.user!._id;

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
      recipientPoints = await UserPoints.createForUser(recipientId) as any;
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
        description: `Received points from ${req.user!.name}`,
        metadata: {
          senderId,
          senderName: req.user!.name,
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
      userPoints = await UserPoints.createForUser(userId) as any;
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
        adminId: req.user!._id,
        adminName: req.user!.name,
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
        adminId: req.user!._id,
        adminName: req.user!.name,
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

export default router;
