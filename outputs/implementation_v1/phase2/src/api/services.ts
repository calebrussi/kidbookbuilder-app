/**
 * Services Initialization
 * 
 * This file initializes all services and makes them available for use in the API routes.
 * This ensures that we have a single instance of each service throughout the application.
 */

import { UserService } from '../services/user/user.service';
import { AuthService } from '../services/auth/auth.service';
import { ContentService } from '../services/content/content.service';
import { PublishingService } from '../services/publishing/publishing.service';
import { StorageService } from '../services/storage/storage.service';
import path from 'path';

// Initialize UserService
export const userService = new UserService();

// Initialize AuthService with UserService dependency
export const authService = new AuthService(userService);

// Initialize ContentService
export const contentService = new ContentService();

// Initialize PublishingService with ContentService dependency
export const publishingService = new PublishingService(contentService);

// Initialize StorageService with storage root directory
export const storageService = new StorageService({
  rootDir: process.env.STORAGE_ROOT || path.join(__dirname, '../../storage')
});

// Export all services
export default {
  userService,
  authService,
  contentService,
  publishingService,
  storageService
}; 