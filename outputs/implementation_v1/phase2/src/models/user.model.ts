/**
 * User Model
 * Defines user-related data structures and interfaces
 */

import { v4 as uuidv4 } from 'uuid';

export type UserRole = 'admin' | 'author' | 'editor' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // Hashed password
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  settings?: UserSettings;
  profileImage?: string;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  emailNotifications: boolean;
  displayFullName: boolean;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface UserCreateInput {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
  settings?: UserSettings;
  profileImage?: string;
}

export interface UserUpdateInput {
  name?: string;
  password?: string;
  role?: UserRole;
  settings?: UserSettings;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export const createNewUser = (input: UserCreateInput): User => {
  const now = new Date();
  return {
    id: uuidv4(),
    email: input.email,
    name: input.name,
    password: input.password, // Note: Should be hashed before storing
    role: input.role || 'author',
    createdAt: now,
    updatedAt: now,
    settings: input.settings || {
      theme: 'system',
      emailNotifications: true,
      displayFullName: true
    },
    profileImage: input.profileImage
  };
};

// Default user settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: 'system',
  emailNotifications: true,
  displayFullName: true
}; 