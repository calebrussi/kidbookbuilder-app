/**
 * Authentication Middleware
 * Verifies JWT tokens and adds user data to request
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Authenticate middleware
 * Verifies the JWT token in the Authorization header
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication token is required'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const user = await authService.verifyToken(token);
      
      // Attach user to request
      req.user = user;
      
      // Continue
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid authentication token'
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid authentication token'
    });
  }
};

/**
 * Authorize middleware
 * Verifies the user has the required roles
 */
export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if user exists on request
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication is required'
      });
    }
    
    // Check if user has required role
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
    }
    
    // Continue
    next();
  };
}; 