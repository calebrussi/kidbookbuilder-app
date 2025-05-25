/**
 * User Service
 * Handles user management operations
 */

import { v4 as uuidv4 } from 'uuid';
import { User, UserCreateInput, UserUpdateInput, createNewUser, DEFAULT_USER_SETTINGS } from '../../models/user.model';

// In-memory storage for development
// Replace with database in production
const users: Map<string, User> = new Map();
const emailToIdMap: Map<string, string> = new Map();

export class UserService {
  /**
   * Create a new user
   */
  async create(input: UserCreateInput): Promise<User> {
    // Check if email already exists
    if (emailToIdMap.has(input.email.toLowerCase())) {
      throw new Error('Email already registered');
    }
    
    // Create user with default settings if not provided
    const user = createNewUser({
      ...input,
      settings: input.settings || DEFAULT_USER_SETTINGS
    });
    
    // Store user in memory
    users.set(user.id, user);
    emailToIdMap.set(user.email.toLowerCase(), user.id);
    
    return user;
  }
  
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const userId = emailToIdMap.get(email.toLowerCase());
    if (!userId) {
      return null;
    }
    
    return users.get(userId) || null;
  }
  
  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    return Array.from(users.values());
  }
  
  /**
   * Update a user
   */
  async update(id: string, input: UserUpdateInput): Promise<User> {
    // Check if user exists
    const existingUser = users.get(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Update user
    const updatedUser: User = {
      ...existingUser,
      ...(input.name && { name: input.name }),
      ...(input.password && { password: input.password }),
      ...(input.role && { role: input.role }),
      ...(input.profileImage && { profileImage: input.profileImage }),
      settings: input.settings 
        ? { ...existingUser.settings, ...input.settings }
        : existingUser.settings,
      updatedAt: new Date()
    };
    
    // Store updated user
    users.set(id, updatedUser);
    
    return updatedUser;
  }
  
  /**
   * Delete a user
   */
  async delete(id: string): Promise<boolean> {
    // Check if user exists
    const existingUser = users.get(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // Remove from maps
    emailToIdMap.delete(existingUser.email.toLowerCase());
    users.delete(id);
    
    return true;
  }
  
  /**
   * Search users by name or email
   */
  async search(query: string): Promise<User[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(users.values()).filter(user => 
      user.name.toLowerCase().includes(lowercaseQuery) ||
      user.email.toLowerCase().includes(lowercaseQuery)
    );
  }
} 