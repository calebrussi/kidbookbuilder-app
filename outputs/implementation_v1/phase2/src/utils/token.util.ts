/**
 * Token Utilities
 * Helper functions for JWT token generation and verification
 */

import { sign, verify } from 'jsonwebtoken';
import { User } from '../models/user.model';

// Secret key should be in environment variables in production
const SECRET_KEY = process.env.JWT_SECRET || 'kid-book-builder-secret-key';

// Token expiry (default: 24 hours)
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '24h';

/**
 * Generate a JWT token for a user
 */
export const generateToken = (user: Omit<User, 'password'>): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  return sign(payload, SECRET_KEY, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): { id: string; email: string; role: string } | null => {
  try {
    const decoded = verify(token, SECRET_KEY);
    return decoded as { id: string; email: string; role: string };
  } catch (error) {
    return null;
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.split(' ')[1];
}; 