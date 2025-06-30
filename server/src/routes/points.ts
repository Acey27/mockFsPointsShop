import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { users, userPoints, transactions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const cheerSchema = z.object({
  toUserId: z.number().int().positive('Invalid user ID'),
  points: z.number().int().min(1, 'Points must be at least 1').max(50, 'Points cannot exceed 50'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

// Get user's point balance and limits
router.get('/balance', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const pointsData = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (pointsData.length === 0) {
      return res.status(404).json({ error: 'Points data not found' });
    }

    const points = pointsData[0];

    // Check if monthly reset is needed
    const now = new Date();
    const lastReset = new Date(points.lastMonthlyReset);
    const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    if (shouldReset) {
      await db
        .update(userPoints)
        .set({
          monthlyCheerUsed: 0,
          lastMonthlyReset: now,
          updatedAt: now,
        })
        .where(eq(userPoints.userId, userId));

      points.monthlyCheerUsed = 0;
    }

    return res.json({
      availablePoints: points.availablePoints,
      totalEarned: points.totalEarned,
      totalSpent: points.totalSpent,
      monthlyCheerLimit: points.monthlyCheerLimit,
      monthlyCheerUsed: points.monthlyCheerUsed,
      monthlyCheerRemaining: points.monthlyCheerLimit - points.monthlyCheerUsed,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get transaction history
router.get('/transactions', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 20;
    const offset = (page - 1) * limit;

    const userTransactions = await db
      .select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        description: transactions.description,
        message: transactions.message,
        metadata: transactions.metadata,
        createdAt: transactions.createdAt,
        fromUser: {
          id: users.id,
          name: users.name,
          avatar: users.avatar,
        },
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.fromUserId, users.id))
      .where(
        eq(transactions.toUserId, userId)
      )
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json({ transactions: userTransactions, page, limit });
  } catch (error) {
    console.error('Get transactions error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send cheer to a peer
router.post('/cheer', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const fromUserId = req.user!.id;
    const validatedData = cheerSchema.parse(req.body);

    // Prevent self-cheer
    if (fromUserId === validatedData.toUserId) {
      return res.status(400).json({ error: 'Cannot cheer yourself' });
    }

    // Check if target user exists and is active
    const targetUser = await db
      .select({ id: users.id, name: users.name, isActive: users.isActive })
      .from(users)
      .where(eq(users.id, validatedData.toUserId))
      .limit(1);

    if (targetUser.length === 0 || !targetUser[0].isActive) {
      return res.status(404).json({ error: 'Target user not found or inactive' });
    }

    // Get sender's points data
    const senderPoints = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, fromUserId))
      .limit(1);

    if (senderPoints.length === 0) {
      return res.status(404).json({ error: 'Sender points data not found' });
    }

    // Check monthly cheer limit
    const now = new Date();
    const lastReset = new Date(senderPoints[0].lastMonthlyReset);
    const shouldReset = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();

    let monthlyCheerUsed = senderPoints[0].monthlyCheerUsed;
    if (shouldReset) {
      monthlyCheerUsed = 0;
    }

    if (monthlyCheerUsed + validatedData.points > senderPoints[0].monthlyCheerLimit) {
      return res.status(400).json({ 
        error: `Monthly cheer limit exceeded. You have ${senderPoints[0].monthlyCheerLimit - monthlyCheerUsed} points remaining this month.` 
      });
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Get receiver's current points
      const receiverPoints = await tx
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, validatedData.toUserId))
        .limit(1);

      let receiverCurrentPoints = { availablePoints: 0, totalEarned: 0 };
      if (receiverPoints.length > 0) {
        receiverCurrentPoints = receiverPoints[0];
      } else {
        // Create points record for receiver if it doesn't exist
        await tx.insert(userPoints).values({
          userId: validatedData.toUserId,
          availablePoints: 0,
          totalEarned: 0,
          totalSpent: 0,
          monthlyCheerLimit: 100,
          monthlyCheerUsed: 0,
          lastMonthlyReset: now,
        });
      }

      // Update sender's monthly usage
      await tx
        .update(userPoints)
        .set({
          monthlyCheerUsed: monthlyCheerUsed + validatedData.points,
          lastMonthlyReset: shouldReset ? now : senderPoints[0].lastMonthlyReset,
          updatedAt: now,
        })
        .where(eq(userPoints.userId, fromUserId));

      // Update receiver's points
      await tx
        .update(userPoints)
        .set({
          availablePoints: receiverCurrentPoints.availablePoints + validatedData.points,
          totalEarned: receiverCurrentPoints.totalEarned + validatedData.points,
          updatedAt: now,
        })
        .where(eq(userPoints.userId, validatedData.toUserId));

      // Record the transaction for the receiver
      await tx.insert(transactions).values({
        fromUserId: fromUserId,
        toUserId: validatedData.toUserId,
        type: 'earned',
        amount: validatedData.points,
        description: `Received cheer from ${req.user!.name}`,
        message: validatedData.message,
      });

      // Record the transaction for the sender
      await tx.insert(transactions).values({
        fromUserId: fromUserId,
        toUserId: validatedData.toUserId,
        type: 'given',
        amount: -validatedData.points,
        description: `Cheered ${targetUser[0].name}`,
        message: validatedData.message,
      });
    });

    return res.json({
      message: `Successfully cheered ${targetUser[0].name} with ${validatedData.points} points!`,
      pointsGiven: validatedData.points,
      recipient: targetUser[0].name,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Cheer error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
