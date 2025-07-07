import express from 'express';
import { Cheer } from '../models/Cheer.js';
import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { requireAuth } from '../middleware/auth.js';
import mongoose from 'mongoose';

const router = express.Router();

// Get current user's cheer statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get points given this month
    const pointsGivenThisMonth = await Cheer.aggregate([
      {
        $match: {
          fromUser: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    // Get points received this month
    const pointsReceivedThisMonth = await Cheer.aggregate([
      {
        $match: {
          toUser: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    // Get total points received all time
    const totalPointsReceived = await Cheer.aggregate([
      {
        $match: {
          toUser: new mongoose.Types.ObjectId(userId)
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    const pointsGiven = pointsGivenThisMonth[0]?.totalPoints || 0;
    const pointsReceived = pointsReceivedThisMonth[0]?.totalPoints || 0;
    const totalHeartBits = totalPointsReceived[0]?.totalPoints || 0;
    const remainingPoints = Math.max(0, 100 - pointsGiven); // 100 points per month limit

    res.json({
      success: true,
      data: {
        pointsGivenThisMonth: pointsGiven,
        pointsReceivedThisMonth: pointsReceived,
        totalHeartBits: totalHeartBits,
        remainingPoints,
        monthlyLimit: 100
      }
    });
  } catch (error) {
    console.error('Error fetching cheer stats:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get users who cheered the current user
router.get('/received', requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get cheers where current user is the recipient - use Cheer collection directly
    const cheers = await Cheer.find({ 
      toUser: userId
    })
      .populate('fromUser', 'name department avatar email')
      .populate('toUser', 'name department avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cheer.countDocuments({ 
      toUser: userId
    });

    res.json({
      success: true,
      data: cheers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching received cheers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get recent cheers (all users)
router.get('/recent', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Get recent cheers - use Cheer collection directly
    const cheers = await Cheer.find({})
      .populate('fromUser', 'name department avatar email')
      .populate('toUser', 'name department avatar email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Cheer.countDocuments({});

    res.json({
      success: true,
      data: cheers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching recent cheers:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create a new cheer
router.post('/', requireAuth, async (req, res) => {
  try {
    const { toUserId, message, amount = 1, points } = req.body;
    const heartbits = amount || points || 1; // Support both 'amount' and 'points' for backward compatibility
    const fromUserId = req.userId;

    // Validate input
    if (!toUserId || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'To user and message are required' 
      });
    }

    if (toUserId === fromUserId) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot cheer yourself' 
      });
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Target user not found' 
      });
    }

    // Get sender user info for transaction descriptions
    const senderUser = await User.findById(fromUserId);
    if (!senderUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sender user not found' 
      });
    }

    // Check monthly limit
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const pointsGivenThisMonth = await Cheer.aggregate([
      {
        $match: {
          fromUser: new mongoose.Types.ObjectId(fromUserId),
          createdAt: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          totalPoints: { $sum: '$points' }
        }
      }
    ]);

    const totalPointsGiven = pointsGivenThisMonth[0]?.totalPoints || 0;
    
    if (totalPointsGiven + heartbits > 100) {
      return res.status(400).json({ 
        success: false, 
        message: `You can only give ${100 - totalPointsGiven} more points this month` 
      });
    }

    // Create the cheer
    const cheer = new Cheer({
      fromUser: fromUserId,
      toUser: toUserId,
      message,
      points: heartbits
    });

    await cheer.save();

    // Also create transaction records for order history
    // Transaction for the giver (spent/given)
    const giverTransaction = new Transaction({
      fromUserId: fromUserId,
      toUserId: toUserId,
      type: 'given',
      amount: heartbits,
      description: `Gave ${heartbits} heartbits to ${targetUser.name}`,
      message: message,
      metadata: {
        transactionType: 'cheer',
        cheerId: cheer._id
      }
    });

    // Transaction for the receiver (earned/received)
    const receiverTransaction = new Transaction({
      fromUserId: fromUserId,
      toUserId: toUserId,
      type: 'received',
      amount: heartbits,
      description: `Received ${heartbits} heartbits from ${senderUser.name}`,
      message: message,
      metadata: {
        transactionType: 'cheer',
        cheerId: cheer._id
      }
    });

    await Promise.all([
      giverTransaction.save(),
      receiverTransaction.save()
    ]);

    // Populate the response
    await cheer.populate('fromUser', 'name department');
    await cheer.populate('toUser', 'name department');

    res.status(201).json({
      success: true,
      data: cheer,
      message: 'Cheer sent successfully!'
    });
  } catch (error) {
    console.error('Error creating cheer:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get leaderboards
router.get('/leaderboards', requireAuth, async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    const currentUserId = req.userId;
    const now = new Date();
    let startDate;

    switch (period) {
      case 'weekly':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        startDate = startOfWeek;
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'alltime':
        startDate = new Date(0); // Beginning of time
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
    }

    // Get the full leaderboard with ranking
    const leaderboard = await Cheer.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$toUser',
          totalPoints: { $sum: '$points' },
          cheerCount: { $sum: 1 }
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
        $unwind: '$user'
      },
      {
        $project: {
          _id: 1,
          name: '$user.name',
          department: '$user.department',
          avatar: '$user.avatar',
          totalPoints: 1,
          cheerCount: 1
        }
      },
      {
        $sort: { totalPoints: -1 }
      }
    ]);

    // Find current user's rank and info
    let currentUserRank = null;
    let currentUserInfo = null;
    
    const currentUserIndex = leaderboard.findIndex(user => user._id.toString() === currentUserId.toString());
    if (currentUserIndex !== -1) {
      currentUserRank = currentUserIndex + 1;
      currentUserInfo = leaderboard[currentUserIndex];
    } else {
      // User not in leaderboard yet, get their info
      const user = await User.findById(currentUserId).select('name department avatar');
      if (user) {
        currentUserInfo = {
          _id: currentUserId,
          name: user.name,
          department: user.department,
          avatar: user.avatar,
          totalPoints: 0,
          cheerCount: 0
        };
        currentUserRank = leaderboard.length + 1;
      }
    }

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.slice(0, 50), // Top 50
        currentUser: {
          rank: currentUserRank,
          info: currentUserInfo
        },
        period,
        total: leaderboard.length
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Search users for cheering
router.get('/search-users', requireAuth, async (req, res) => {
  try {
    const { query = '', department = '' } = req.query;
    const currentUserId = req.userId;

    let searchQuery = {
      _id: { $ne: currentUserId } // Exclude current user
    };

    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' };
    }

    if (department) {
      searchQuery.department = department;
    }

    const users = await User.find(searchQuery)
      .select('name department')
      .limit(20)
      .sort({ name: 1 });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a comment to a cheer
router.post('/:cheerID/comments', requireAuth, async (req, res) => {
  try {
    const { cheerID } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    // Validate inputs
    if (!comment || !comment.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment text is required' 
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Comment cannot exceed 1000 characters' 
      });
    }

    // Verify the cheer exists
    const cheer = await Cheer.findById(cheerID);
    if (!cheer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cheer not found' 
      });
    }

    // Create the comment
    const newComment = await Comment.create({
      cheerID,
      fromUser: userId,
      comment: comment.trim()
    });

    // Populate the comment with user data
    await newComment.populate('fromUser', 'name avatar department');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get comments for a specific cheer
router.get('/:cheerID/comments', requireAuth, async (req, res) => {
  try {
    const { cheerID } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // Verify the cheer exists
    const cheer = await Cheer.findById(cheerID);
    if (!cheer) {
      return res.status(404).json({ 
        success: false, 
        message: 'Cheer not found' 
      });
    }

    // Get comments with pagination
    const comments = await Comment.find({ cheerID })
      .populate('fromUser', 'name avatar department')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination
    const totalComments = await Comment.countDocuments({ cheerID });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalComments,
        pages: Math.ceil(totalComments / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get comment counts for multiple cheers
router.post('/comments/counts', requireAuth, async (req, res) => {
  try {
    const { cheerIDs } = req.body;

    if (!Array.isArray(cheerIDs) || cheerIDs.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'cheerIDs array is required' 
      });
    }

    // Get comment counts for each cheer
    const commentCounts = await Comment.aggregate([
      {
        $match: {
          cheerID: { $in: cheerIDs.map(id => new mongoose.Types.ObjectId(id)) }
        }
      },
      {
        $group: {
          _id: '$cheerID',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easy lookup
    const countsObj = {};
    commentCounts.forEach(({ _id, count }) => {
      countsObj[_id.toString()] = count;
    });

    // Ensure all requested cheerIDs have a count (even if 0)
    cheerIDs.forEach(cheerID => {
      if (!countsObj[cheerID]) {
        countsObj[cheerID] = 0;
      }
    });

    res.json({
      success: true,
      data: countsObj
    });
  } catch (error) {
    console.error('Error fetching comment counts:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete a comment (only by the comment author)
router.delete('/comments/:commentID', requireAuth, async (req, res) => {
  try {
    const { commentID } = req.params;
    const userId = req.userId;

    // Find the comment
    const comment = await Comment.findById(commentID);
    if (!comment) {
      return res.status(404).json({ 
        success: false, 
        message: 'Comment not found' 
      });
    }

    // Check if the user is the comment author
    if (comment.fromUser.toString() !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only delete your own comments' 
      });
    }

    // Delete the comment
    await Comment.findByIdAndDelete(commentID);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add a comment to a cheer
router.post('/:cheerID/comments', requireAuth, async (req, res) => {
  try {
    const { cheerID } = req.params;
    const { comment } = req.body;
    const userId = req.userId;

    // Validate input
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment is too long (max 1000 characters)' });
    }

    // Check if cheer exists
    const cheer = await Cheer.findById(cheerID);
    if (!cheer) {
      return res.status(404).json({ error: 'Cheer not found' });
    }

    // Import Comment model
    const { Comment } = await import('../models/Comment.js');

    // Create comment
    const newComment = new Comment({
      cheerID,
      fromUser: userId,
      comment: comment.trim()
    });

    await newComment.save();

    // Populate user details
    await newComment.populate('fromUser', 'name department avatar');

    res.status(201).json({
      success: true,
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get comments for a cheer
router.get('/:cheerID/comments', requireAuth, async (req, res) => {
  try {
    const { cheerID } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check if cheer exists
    const cheer = await Cheer.findById(cheerID);
    if (!cheer) {
      return res.status(404).json({ error: 'Cheer not found' });
    }

    // Import Comment model
    const { Comment } = await import('../models/Comment.js');

    // Get comments with pagination
    const comments = await Comment.find({ cheerID })
      .populate('fromUser', 'name department avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const totalComments = await Comment.countDocuments({ cheerID });

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalComments / limit),
          totalComments,
          hasMore: page * limit < totalComments
        }
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete comment (only by comment author)
router.delete('/comments/:commentID', requireAuth, async (req, res) => {
  try {
    const { commentID } = req.params;
    const userId = req.userId;

    // Import Comment model
    const { Comment } = await import('../models/Comment.js');

    // Find comment
    const comment = await Comment.findById(commentID);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.fromUser.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Delete comment
    await Comment.findByIdAndDelete(commentID);

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
