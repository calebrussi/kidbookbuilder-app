/**
 * Authentication types for the Kid Book Builder application
 */

/**
 * User roles in the application
 */
export enum UserRole {
  Parent = 'parent',
  Child = 'child',
  Admin = 'admin',
}

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  preferences?: Record<string, unknown>;
}

/**
 * Login credentials
 */
export interface Credentials {
  username: string;
  password: string;
}

/**
 * Authentication token
 */
export interface AuthToken {
  token: string;
  expiresAt: Date;
}

/**
 * Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  token?: AuthToken;
  error?: string;
}

/**
 * Registration data
 */
export interface RegistrationData {
  username: string;
  password: string;
  email?: string;
  displayName: string;
  role: UserRole;
} 