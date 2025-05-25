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
 * Find all users
 */
export const findAll = async () => {
  return Object.values(users);
};

/**
 * Find user by ID
 */
export const findById = async (id: string) => {
  return users[id];
};

/**
 * Create a new user
 */
export const create = async (userData: any) => {
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
  
  return newUser;
};

/**
 * Update a user
 */
export const update = async (id: string, updateData: any) => {
  // Check if user exists
  const user = users[id];
  if (!user) {
    throw new Error('User not found');
  }
  
  // Check if email is being changed and if it's already in use
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = Object.values(users).find(user => user.email === updateData.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
  }
  
  // Update user
  const updatedUser = {
    ...user,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  // Save user
  users[id] = updatedUser;
  
  return updatedUser;
};

/**
 * Delete a user
 */
export const delete_ = async (id: string) => {
  // Check if user exists
  if (!users[id]) {
    throw new Error('User not found');
  }
  
  // Delete user
  delete users[id];
  
  return true;
};

// Workaround for naming issue with "delete" being a reserved word
export { delete_ as delete };

/**
 * Search users
 */
export const search = async (query: string) => {
  // Convert query to lowercase for case-insensitive search
  const lowercaseQuery = query.toLowerCase();
  
  // Search users by name or email
  return Object.values(users).filter(user => {
    return user.name.toLowerCase().includes(lowercaseQuery) || 
           user.email.toLowerCase().includes(lowercaseQuery);
  });
}; 