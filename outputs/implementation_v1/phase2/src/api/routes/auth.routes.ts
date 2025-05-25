/**
 * Authentication Routes
 * Handles user registration, login, and password management
 */

import { Router, Request, Response } from 'express';
import { authService, userService } from '../services';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// POST /api/auth/register - Register a new user
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Basic validation
    if (!email || !password || !name) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Email, password, and name are required'
      });
      return;
    }
    
    // Register user
    const authResponse = await authService.register({
      email,
      password,
      name,
      role: 'author' // Default role for new users
    });
    
    res.status(201).json({
      success: true,
      data: authResponse
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/auth/login - Login a user
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Basic validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Email and password are required'
      });
      return;
    }
    
    // Login user
    const authResponse = await authService.login({ email, password });
    
    res.status(200).json({
      success: true,
      data: authResponse
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/auth/change-password - Change user password
router.post('/change-password', authenticate, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Current password and new password are required'
      });
      return;
    }
    
    // Validate new password strength
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'New password must be at least 8 characters long'
      });
      return;
    }
    
    // Change password
    await authService.changePassword(userId, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Password change failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/auth/me - Get current user data
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'User not authenticated'
      });
      return;
    }
    
    // Get user data
    const user = await userService.findById(userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User no longer exists'
      });
      return;
    }
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = user;
    
    res.status(200).json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve user data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 