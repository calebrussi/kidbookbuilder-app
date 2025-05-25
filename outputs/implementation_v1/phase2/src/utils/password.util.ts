/**
 * Password Utilities
 * Helper functions for password hashing and verification
 */

import * as crypto from 'crypto';

// In a production environment, consider using bcrypt or Argon2
// This implementation uses Node.js crypto module for simplicity

// Salt length
const SALT_LENGTH = 16;

// Hash iterations (higher is more secure but slower)
const HASH_ITERATIONS = 10000;

// Hash key length
const KEY_LENGTH = 64;

// Hash algorithm
const ALGORITHM = 'sha512';

/**
 * Hash a password with a salt
 */
export const hashPassword = (password: string): { hash: string; salt: string } => {
  // Generate a random salt
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  
  // Hash the password with the salt
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    KEY_LENGTH,
    ALGORITHM
  ).toString('hex');
  
  return { hash, salt };
};

/**
 * Verify a password against a stored hash and salt
 */
export const verifyPassword = (password: string, storedHash: string, salt: string): boolean => {
  // Hash the input password with the stored salt
  const hash = crypto.pbkdf2Sync(
    password,
    salt,
    HASH_ITERATIONS,
    KEY_LENGTH,
    ALGORITHM
  ).toString('hex');
  
  // Compare the generated hash with the stored hash
  return hash === storedHash;
};

/**
 * Generate a secure random password (for resets, initial passwords, etc.)
 */
export const generateRandomPassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const randomBytes = crypto.randomBytes(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomBytes[i] % chars.length);
  }
  
  return password;
}; 