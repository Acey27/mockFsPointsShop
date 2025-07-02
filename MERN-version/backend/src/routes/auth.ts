import express from 'express';
import { User, UserPoints } from '../models/index.js';
import { 
  authenticateToken, 
  generateToken, 
  generateRefreshToken,
  verifyRefreshToken,
  requireDatabase 
} from '../middleware/auth.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { validateRequest } from '../middleware/errorHandler.js';
import { 
  userRegistrationSchema, 
  userLoginSchema, 
  userUpdateSchema 
} from '../utils/validation.js';

const router = express.Router();

// All auth routes require database
router.use(requireDatabase);

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  validateRequest(userRegistrationSchema),
  asyncHandler(async (req, res) => {
    const { email, password, name, department, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      name,
      department,
      avatar,
      role: 'user' // Default role
    });

    // Create user points record
    await UserPoints.createForUser(user._id);

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Remove password from response
    const userResponse = user.toJSON();

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token,
        refreshToken
      }
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',
  validateRequest(userLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError('Account is inactive. Please contact administrator.', 401);
    }

    // Validate password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    // Get user points
    const userPoints = await UserPoints.findByUserId(user._id);

    // Remove password from response
    const userResponse = user.toJSON();

    res.json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userResponse,
        points: userPoints || null,
        token,
        refreshToken
      }
    });
  })
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Get user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const newToken = generateToken(user);
      const newRefreshToken = generateRefreshToken(user);

      res.json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // Get user with points
    const userPoints = await UserPoints.findByUserId(req.user!._id);

    res.json({
      status: 'success',
      data: {
        user: req.user,
        points: userPoints || null
      }
    });
  })
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile',
  authenticateToken,
  validateRequest(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const { name, department, avatar } = req.body;
    const userId = req.user!._id;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        ...(name && { name }),
        ...(department && { department }),
        ...(avatar !== undefined && { avatar })
      },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user: updatedUser
      }
    });
  })
);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!._id;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('New password must be at least 6 characters long', 400);
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });
  })
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout',
  authenticateToken,
  asyncHandler(async (req, res) => {
    // In a more advanced implementation, you might want to:
    // 1. Blacklist the token
    // 2. Store logout timestamp
    // 3. Clear any server-side sessions

    res.json({
      status: 'success',
      message: 'Logged out successfully'
    });
  })
);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify if token is valid
 * @access  Private
 */
router.get('/verify',
  authenticateToken,
  asyncHandler(async (req, res) => {
    res.json({
      status: 'success',
      message: 'Token is valid',
      data: {
        user: req.user,
        isValid: true
      }
    });
  })
);

/**
 * @route   POST /api/auth/promote-admin
 * @desc    Promote a user to admin (one-time setup)
 * @access  Public with special key
 */
router.post('/promote-admin',
  asyncHandler(async (req, res) => {
    const { email, adminKey } = req.body;

    // Simple admin key check - in production, this would be more secure
    if (adminKey !== 'SETUP_ADMIN_2025') {
      throw new AppError('Invalid admin key', 403);
    }

    // Check if any admin users already exist
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      throw new AppError('Admin user already exists. Use the role management endpoint instead.', 400);
    }

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    // Find the user to promote
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Promote to admin
    user.role = 'admin';
    await user.save();

    res.json({
      status: 'success',
      message: 'User promoted to admin successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      }
    });
  })
);

export default router;
