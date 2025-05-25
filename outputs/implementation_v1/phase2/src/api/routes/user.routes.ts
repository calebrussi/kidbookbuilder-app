import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { userService, authService } from '../services';

const router = Router();

// GET /api/users - Get all users
router.get('/', authenticate, authorize(['admin']), async (req: any, res: any) => {
  try {
    const users = await userService.findAll();
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => {
      const { password, ...sanitizedUser } = user;
      return sanitizedUser;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    // Only admins can access other user data
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this user data'
      });
      return;
    }
    
    const user = await userService.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
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
      error: 'Failed to retrieve user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users - Create new user
router.post('/', authenticate, authorize(['admin']), async (req: any, res: any) => {
  try {
    const userData = req.body;
    
    // Create user
    const user = await userService.create(userData);
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = user;
    
    res.status(201).json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticate, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Only admins can update other user data or change roles
    if (req.user?.id !== id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this user'
      });
      return;
    }
    
    // Only admins can update user roles
    if (updateData.role && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only administrators can change user roles'
      });
      return;
    }
    
    // Update user
    const updatedUser = await userService.update(id, updateData);
    
    // Remove sensitive information
    const { password, ...sanitizedUser } = updatedUser;
    
    res.status(200).json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticate, authorize(['admin']), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    
    // Delete user
    await userService.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/users/search - Search users
router.post('/search', authenticate, authorize(['admin']), async (req: any, res: any) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Search query is required'
      });
      return;
    }
    
    const users = await userService.search(query);
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => {
      const { password, ...sanitizedUser } = user;
      return sanitizedUser;
    });
    
    res.status(200).json({
      success: true,
      data: sanitizedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 