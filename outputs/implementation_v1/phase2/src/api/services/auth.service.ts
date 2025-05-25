import { v4 as uuidv4 } from 'uuid';

// Mock in-memory database
const users: Record<string, any> = {
  'admin-user': {
    id: 'admin-user',
    email: 'admin@example.com',
    password: 'admin123', // In a real app, this would be hashed
    name: 'Admin User',
    role: 'admin',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  'author-user': {
    id: 'author-user',
    email: 'author@example.com',
    password: 'author123', // In a real app, this would be hashed
    name: 'Author User',
    role: 'author',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};

/**
 * Register a new user
 */
export const register = async (userData: any) => {
  // Check if email already exists
  const existingUser = Object.values(users).find(user => user.email === userData.email);
  if (existingUser) {
    throw new Error('Email already in use');
  }
  
  // Create new user
  const newUser = {
    id: uuidv4(),
    email: userData.email,
    password: userData.password, // In a real app, this would be hashed
    name: userData.name,
    role: userData.role || 'author',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save user
  users[newUser.id] = newUser;
  
  // Generate JWT token
  const token = `mock-jwt-token-${newUser.id}`;
  
  // Return user and token
  const { password, ...userWithoutPassword } = newUser;
  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * Login a user
 */
export const login = async ({ email, password }: { email: string; password: string }) => {
  // Find user by email
  const user = Object.values(users).find(user => user.email === email);
  
  // Check if user exists and password matches
  if (!user || user.password !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Generate JWT token
  const token = `mock-jwt-token-${user.id}`;
  
  // Return user and token
  const { password: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    token
  };
};

/**
 * Change user password
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  // Find user
  const user = users[userId];
  
  // Check if user exists
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if current password matches
  if (user.password !== currentPassword) {
    throw new Error('Current password is incorrect');
  }
  
  // Update password
  user.password = newPassword;
  user.updatedAt = new Date().toISOString();
  
  return true;
};

/**
 * Verify JWT token
 */
export const verifyToken = async (token: string) => {
  // Extract user ID from token
  const parts = token.split('-');
  const userId = parts[parts.length - 1];
  
  // Find user
  const user = users[userId];
  
  // Check if user exists
  if (!user) {
    throw new Error('Invalid token');
  }
  
  // Return user without password
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}; 