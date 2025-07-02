import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { User, UserPoints } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';

const router = Router();

// Get users for cheering (authenticated users only) - limited info
router.get('/for-cheering', requireAuth, async (req, res) => {
  try {
    const users = await User.find({ 
      isActive: true,
      _id: { $ne: req.user._id } // Exclude current user
    })
      .select('name email department')
      .sort({ name: 1 })
      .limit(50); // Limit to 50 users for performance

    return res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    console.error('Users for cheering error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error' 
    });
  }
});

// Get all users (admin only) - for frontend compatibility
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    const query= {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.json({
      users,
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

// Get current user profile (authenticated users only)
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user points
    const userPoints = await UserPoints.findOne({ userId: user._id });
    
    return res.json({
      ...user.toJSON(),
      points: userPoints?.availablePoints || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');
    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get user leaderboard
router.get('/leaderboard', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const leaderboard = await UserPoints.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          'user.isActive': true
        }
      },
      {
        $sort: { availablePoints: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: limit
      },
      {
        $project: {
          _id: 0,
          userId: '$user._id',
          email: '$user.email',
          name: '$user.name',
          currentPoints: '$availablePoints',
          totalEarned: 1,
          totalSpent: 1,
          rank: { $add: [skip, '$$ROOT.rank'] }
        }
      }
    ]);

    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      rank: skip + index + 1
    }));

    const totalUsers = await UserPoints.countDocuments();

    return res.json({
      leaderboard: leaderboardWithRank,
      pagination: {
        page,
        limit,
        total: totalUsers,
        totalPages: Math.ceil(totalUsers / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get all users
router.get('/', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    // Get points for each user
    const userIds = users.map(user => user._id);
    const userPointsMap = new Map();
    
    const userPoints = await UserPoints.find({ userId: { $in: userIds } });
    userPoints.forEach(up => {
      userPointsMap.set(up.userId.toString(), up);
    });

    const usersWithPoints = users.map(user => ({
      ...user.toJSON(),
      points: userPointsMap.get(user._id.toString())?.availablePoints || 0
    }));

    return res.json({
      users: usersWithPoints,
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

// Admin routes - Get specific user
router.get('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userPoints = await UserPoints.findOne({ userId: user._id });

    return res.json({
      ...user.toJSON(),
      points: userPoints?.availablePoints || 0,
      totalEarned: userPoints?.totalEarned || 0,
      totalSpent: userPoints?.totalSpent || 0
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Update user
router.patch('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, isActive, role } = req.body;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingEmailUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingEmailUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    // Update user fields
    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;
    if (role !== undefined) user.role = role;

    await user.save();

    const updatedUser = await User.findById(userId).select('-password');
    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Update user role
router.patch('/:userId/role', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be either "user" or "admin"' });
    }

    // Prevent admin from changing their own role
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot change your own role' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    const updatedUser = await User.findById(userId).select('-password');
    return res.json({ 
      status: 'success',
      message: `User role updated to ${role} successfully`,
      data: { user: updatedUser }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Delete user
router.delete('/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get users for cheering (authenticated users only) - limited info
export default router;
