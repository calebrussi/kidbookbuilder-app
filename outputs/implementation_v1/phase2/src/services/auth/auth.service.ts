/**
 * Authentication Service
 * Handles user authentication, registration, and password management
 */

import { User, UserCredentials, UserCreateInput, AuthResponse } from '../../models/user.model';
import { hashPassword, verifyPassword } from '../../utils/password.util';
import { generateToken } from '../../utils/token.util';
import { UserService } from '../user/user.service';

// In-memory storage for development
// Replace with database in production
const users: Map<string, User> = new Map();
const emailToIdMap: Map<string, string> = new Map();

export class AuthService {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  /**
   * Register a new user
   */
  async register(input: UserCreateInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingUser = await this.userService.findByEmail(input.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash the password
    const { hash, salt } = hashPassword(input.password);

    // Create the user with hashed password
    const user = await this.userService.create({
      ...input,
      password: `${hash}:${salt}` // Store hash and salt together
    });

    // Generate JWT token
    const token = generateToken(this.sanitizeUser(user));

    // Return token and user info
    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Login a user
   */
  async login(credentials: UserCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await this.userService.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Extract hash and salt from stored password
    const [hash, salt] = user.password.split(':');

    // Verify password
    const isPasswordValid = verifyPassword(credentials.password, hash, salt);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken(this.sanitizeUser(user));

    // Return token and user info
    return {
      token,
      user: this.sanitizeUser(user)
    };
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    // Find user
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Extract hash and salt from stored password
    const [hash, salt] = user.password.split(':');

    // Verify old password
    const isPasswordValid = verifyPassword(oldPassword, hash, salt);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash the new password
    const { hash: newHash, salt: newSalt } = hashPassword(newPassword);

    // Update user password
    await this.userService.update(userId, {
      password: `${newHash}:${newSalt}`
    });

    return true;
  }

  /**
   * Remove sensitive information from user object
   */
  private sanitizeUser(user: User): Omit<User, 'password'> {
    // Create a copy of the user object without the password
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
} 