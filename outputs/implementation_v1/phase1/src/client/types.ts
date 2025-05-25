/**
 * User roles supported by the system
 */
export enum UserRole {
  Child = 'Child',
  Parent = 'Parent',
  Admin = 'Admin',
}

/**
 * User profile data
 */
export interface User {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  email?: string;
  createdAt?: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  message: string;
  user: User;
  token: string;
}

/**
 * Content types
 */
export enum ContentType {
  Text = 'text',
  Image = 'image',
  Audio = 'audio',
  Video = 'video',
}

/**
 * Content metadata
 */
export interface ContentMetadata {
  id: string;
  title: string;
  authorId: string;
  authorName: string;
  contentType: ContentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  description?: string;
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  stack?: string;
} 