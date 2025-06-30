import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { users } from '../db/schema.js';
import { eq, like, not, and, or } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Get all users (for peer selection)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const currentUserId = req.user!.id;
    const search = req.query['search'] as string;
    const department = req.query['department'] as string;

    let whereClause = and(
      eq(users.isActive, true),
      not(eq(users.id, currentUserId)) // Exclude current user
    )!;

    // Apply search filter
    if (search) {
      whereClause = and(
        whereClause,
        or(
          like(users.name, `%${search}%`),
          like(users.department, `%${search}%`)
        )!
      )!;
    }

    // Apply department filter
    if (department && department !== 'all') {
      whereClause = and(
        whereClause,
        eq(users.department, department)
      )!;
    }

    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        department: users.department,
        avatar: users.avatar,
      })
      .from(users)
      .where(whereClause)
      .limit(50); // Reasonable limit

    return res.json({ users: userList });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const user = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        department: users.department,
        avatar: users.avatar,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ user: user[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  department: z.string().min(2, 'Department is required').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
});

router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const validatedData = updateProfileSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updateData: Record<string, any> = {};
    if (validatedData.name) updateData['name'] = validatedData.name;
    if (validatedData.department) updateData['department'] = validatedData.department;
    if (validatedData.avatar !== undefined) updateData['avatar'] = validatedData.avatar;
    updateData['updatedAt'] = new Date();

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        department: users.department,
        avatar: users.avatar,
        role: users.role,
      });

    if (updatedUser.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      message: 'Profile updated successfully',
      user: updatedUser[0],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
