import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { users, userPoints } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { hashPassword, comparePassword, generateToken } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(2, 'Department is required'),
  avatar: z.string().url().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Create user
    const newUser = await db
      .insert(users)
      .values({
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name,
        department: validatedData.department,
        avatar: validatedData.avatar || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        department: users.department,
        role: users.role,
        avatar: users.avatar,
      });

    // Create initial user points
    await db.insert(userPoints).values({
      userId: newUser[0].id,
      availablePoints: 100, // Welcome bonus
      totalEarned: 100,
    });

    // Generate token
    const token = generateToken(newUser[0]);

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser[0],
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (user.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const foundUser = user[0];

    // Check if user is active
    if (!foundUser.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await comparePassword(validatedData.password, foundUser.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({
      id: foundUser.id,
      email: foundUser.email,
      name: foundUser.name,
      department: foundUser.department,
      role: foundUser.role,
    });

    return res.json({
      message: 'Login successful',
      user: {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        department: foundUser.department,
        role: foundUser.role,
        avatar: foundUser.avatar,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
