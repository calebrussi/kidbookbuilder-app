import express from 'express';
import { UserRole } from '../../utils/auth/types';

const router = express.Router();

/**
 * Authentication middleware to verify token
 */
export const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or invalid',
    });
  }

  const token = authHeader.split(' ')[1];
  const user = req.apiContext.authService.validateToken(token);
  
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is invalid or expired',
    });
  }

  // Attach user to request
  req.user = user;
  next();
};

/**
 * Register a new user
 * POST /api/auth/register
 */
router.post('/register', (req, res) => {
  const { username, password, displayName, email, role } = req.body;

  // Validate input
  if (!username || !password || !displayName || !role) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password, displayName, role',
    });
  }

  // Validate role
  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({
      error: 'BadRequest',
      message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
    });
  }

  // Register user
  const result = req.apiContext.authService.register({
    username,
    password,
    displayName,
    email,
    role,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'RegistrationFailed',
      message: result.error,
    });
  }

  // Return user and token
  res.status(201).json({
    message: 'User registered successfully',
    user: result.user,
    token: result.token,
  });
});

/**
 * Login a user
 * POST /api/auth/login
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password',
    });
  }

  // Login user
  const result = req.apiContext.authService.login({
    username,
    password,
  });

  if (!result.success) {
    return res.status(401).json({
      error: 'AuthenticationFailed',
      message: result.error,
    });
  }

  // Return user and token
  res.json({
    message: 'Login successful',
    user: result.user,
    token: result.token,
  });
});

/**
 * Logout a user
 * POST /api/auth/logout
 */
router.post('/logout', authMiddleware, (req, res) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization as string;
  const token = authHeader.split(' ')[1];

  // Logout user
  const result = req.apiContext.authService.logout(token);

  res.json({
    message: result ? 'Logout successful' : 'Token already invalidated',
  });
});

/**
 * Get current user profile
 * GET /api/auth/me
 */
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    user: req.user,
  });
});

/**
 * List all users (admin only)
 * GET /api/auth/users
 */
router.get('/users', authMiddleware, (req, res) => {
  // Check if user is admin
  if (req.user.role !== UserRole.Admin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Only admins can list all users',
    });
  }

  // Get all users
  const users = req.apiContext.authService.listUsers();

  res.json({
    users,
  });
});

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export { router as authRouter }; 