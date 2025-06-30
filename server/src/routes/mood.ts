import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { moodEntries } from '../db/schema.js';
import { eq, desc, and, gte } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schema
const moodSchema = z.object({
  mood: z.enum(['excellent', 'good', 'okay', 'not-great', 'poor'], {
    errorMap: () => ({ message: 'Invalid mood selection' })
  }),
  comment: z.string().max(500, 'Comment too long').optional(),
});

// Log mood entry
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const validatedData = moodSchema.parse(req.body);

    const newMoodEntry = await db
      .insert(moodEntries)
      .values({
        userId,
        mood: validatedData.mood,
        comment: validatedData.comment || null,
      })
      .returning();

    return res.json({
      message: 'Mood logged successfully',
      moodEntry: newMoodEntry[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Log mood error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mood history
router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query['days'] as string) || 30;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const offset = (page - 1) * limit;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const moodHistory = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.date, startDate)
        )
      )
      .orderBy(desc(moodEntries.date))
      .limit(limit)
      .offset(offset);

    return res.json({
      moodEntries: moodHistory,
      page,
      limit,
      days,
    });
  } catch (error) {
    console.error('Get mood history error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get mood insights/stats
router.get('/insights', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const days = parseInt(req.query['days'] as string) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const recentMoods = await db
      .select()
      .from(moodEntries)
      .where(
        and(
          eq(moodEntries.userId, userId),
          gte(moodEntries.date, startDate)
        )
      )
      .orderBy(desc(moodEntries.date));

    // Calculate insights
    const moodCounts = recentMoods.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEntries = recentMoods.length;
    const mostCommonMood = Object.entries(moodCounts).reduce(
      (max, [mood, count]) => count > max.count ? { mood, count } : max,
      { mood: '', count: 0 }
    );

    // Calculate average mood score (excellent=5, good=4, okay=3, not-great=2, poor=1)
    const moodScores = {
      excellent: 5,
      good: 4,
      okay: 3,
      'not-great': 2,
      poor: 1,
    };

    const averageScore = totalEntries > 0 
      ? recentMoods.reduce((sum, entry) => sum + moodScores[entry.mood as keyof typeof moodScores], 0) / totalEntries
      : 0;

    // Find streak
    let currentStreak = 0;
    for (const entry of recentMoods) {
      if (entry.mood === 'excellent' || entry.mood === 'good') {
        currentStreak++;
      } else {
        break;
      }
    }

    return res.json({
      totalEntries,
      moodCounts,
      mostCommonMood: mostCommonMood.mood || null,
      averageScore: Math.round(averageScore * 10) / 10,
      currentPositiveStreak: currentStreak,
      days,
      recentMoods: recentMoods.slice(0, 5), // Last 5 entries for quick view
    });
  } catch (error) {
    console.error('Get mood insights error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
