import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { Mood } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';

const router = Router();

// Get current user's moods
router.get('/', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query= { userId: req.user._id };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const moods = await Mood.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mood.countDocuments(query);

    return res.json({
      moods,
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

// Get mood statistics for current user
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Use the static method from the model
    const analytics = await Mood.getMoodAnalytics(req.user._id, days);

    return res.json({
      ...analytics,
      periodDays: days
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a new mood entry
router.post('/', requireAuth, async (req, res) => {
  try {
    const { mood, comment } = req.body;
    const userId = req.user._id;

    // Validation
    const validMoods = ['excellent', 'good', 'okay', 'not-great', 'poor'];
    if (!mood || !validMoods.includes(mood)) {
      return res.status(400).json({ 
        message: 'Mood must be one of: excellent, good, okay, not-great, poor' 
      });
    }

    // Check if user already has a mood entry for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingMood = await Mood.findOne({
      userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    if (existingMood) {
      // Update existing mood entry
      existingMood.mood = mood;
      if (comment !== undefined) existingMood.comment = comment;

      await existingMood.save();

      return res.json({
        message: 'Mood updated successfully',
        mood: existingMood
      });
    } else {
      // Create new mood entry
      const newMood = new Mood({
        userId,
        mood,
        comment: comment || '',
        date: new Date()
      });

      await newMood.save();

      return res.status(201).json({
        message: 'Mood created successfully',
        mood: newMood
      });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get mood entry for a specific date
router.get('/date/:date', requireAuth, async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user._id;

    if (!date) {
      return res.status(400).json({ message: 'Date parameter is required' });
    }

    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const mood = await Mood.findOne({
      userId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    });

    if (!mood) {
      return res.status(404).json({ message: 'No mood entry found for this date' });
    }

    return res.json(mood);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update a mood entry
router.patch('/:moodId', requireAuth, async (req, res) => {
  try {
    const { moodId } = req.params;
    const { mood, comment } = req.body;

    if (!moodId || !validateObjectId(moodId)) {
      return res.status(400).json({ message: 'Invalid mood ID' });
    }

    const moodEntry = await Mood.findById(moodId);
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    // Check if user owns this mood entry
    if (moodEntry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update fields
    if (mood !== undefined) {
      const validMoods = ['excellent', 'good', 'okay', 'not-great', 'poor'];
      if (!validMoods.includes(mood)) {
        return res.status(400).json({ 
          message: 'Mood must be one of: excellent, good, okay, not-great, poor' 
        });
      }
      moodEntry.mood = mood;
    }

    if (comment !== undefined) moodEntry.comment = comment;

    await moodEntry.save();

    return res.json({
      message: 'Mood updated successfully',
      mood: moodEntry
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Delete a mood entry
router.delete('/:moodId', requireAuth, async (req, res) => {
  try {
    const { moodId } = req.params;

    if (!moodId || !validateObjectId(moodId)) {
      return res.status(400).json({ message: 'Invalid mood ID' });
    }

    const moodEntry = await Mood.findById(moodId);
    if (!moodEntry) {
      return res.status(404).json({ message: 'Mood entry not found' });
    }

    // Check if user owns this mood entry
    if (moodEntry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Mood.findByIdAndDelete(moodId);

    return res.json({
      message: 'Mood entry deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get all mood data
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query= {};

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const moods = await Mood.find(query)
      .populate('userId', 'name email department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mood.countDocuments(query);

    return res.json({
      moods,
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

// Admin routes - Get mood statistics for all users
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);
    
    // Use the static method from the model for team analytics
    const teamAnalytics = await Mood.getTeamMoodAnalytics();

    return res.json({
      ...teamAnalytics,
      periodDays: days
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get mood data for specific user
router.get('/admin/user/:userId', requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId || !validateObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query= { userId };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const moods = await Mood.find(query)
      .populate('userId', 'name email department')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mood.countDocuments(query);

    return res.json({
      moods,
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

// Get mood history - alias for frontend compatibility
router.get('/history', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;

    const query= { userId: req.user._id };

    // Add date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const moods = await Mood.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mood.countDocuments(query);

    return res.json({
      status: 'success',
      data: moods,
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
      error: 'Failed to fetch mood history'
    });
  }
});

export default router;
