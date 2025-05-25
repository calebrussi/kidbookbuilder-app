/**
 * Integrated Example for Kid Book Builder Phase 1
 * 
 * This example demonstrates the integration of the storage and authentication components.
 * It simulates a user registering, creating content, and accessing it with authentication.
 */

import path from 'path';
import { Storage } from '../utils/storage';
import { AuthService } from '../utils/auth/auth-service';
import { UserRole } from '../utils/auth/types';

// Path to the storage directory
const storagePath = path.join(__dirname, '../../storage');

// Initialize storage
const storage = new Storage(storagePath);
console.log('Storage initialized at:', storagePath);

// Initialize authentication service
const authService = new AuthService(storage);
console.log('Authentication service initialized');

// Function to simulate a parent creating a story
async function createStory(
  authToken: string,
  storyTitle: string,
  storyContent: string
): Promise<boolean> {
  // Validate authentication token
  const user = authService.validateToken(authToken);
  if (!user) {
    console.error('Authentication failed: Invalid or expired token');
    return false;
  }

  // Check if user has permission (must be a parent or admin)
  if (user.role !== UserRole.Parent && user.role !== UserRole.Admin) {
    console.error('Permission denied: Only parents and admins can create stories');
    return false;
  }

  // Create story metadata
  const storyId = `story_${Date.now()}`;
  const storyMetadata = {
    id: storyId,
    title: storyTitle,
    authorId: user.id,
    authorName: user.displayName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save story content
  const contentPath = `content/${user.id}/${storyId}/story.txt`;
  storage.writeFile(contentPath, storyContent);
  
  // Save story metadata
  const metadataPath = `content/${user.id}/${storyId}/metadata.json`;
  storage.writeFile(metadataPath, JSON.stringify(storyMetadata, null, 2));
  
  console.log(`Story "${storyTitle}" created successfully (ID: ${storyId})`);
  return true;
}

// Function to simulate reading a story
async function readStory(
  authToken: string | null,
  userId: string,
  storyId: string
): Promise<string | null> {
  // If token is provided, validate it
  if (authToken) {
    const user = authService.validateToken(authToken);
    if (!user) {
      console.error('Authentication failed: Invalid or expired token');
      return null;
    }
    
    // If the user is not the owner and not an admin, deny access
    if (user.id !== userId && user.role !== UserRole.Admin) {
      console.error('Permission denied: You can only access your own stories');
      return null;
    }
  }
  
  // Try to read the story content
  const contentPath = `content/${userId}/${storyId}/story.txt`;
  const content = storage.readFile(contentPath);
  
  if (!content) {
    console.error('Story not found');
    return null;
  }
  
  return content.toString();
}

// Main execution flow
async function runExample() {
  console.log('------------- Kid Book Builder Integration Example -------------');
  
  // Generate a timestamp to make usernames unique - use full timestamp for more uniqueness
  const timestamp = Date.now().toString();
  
  // 1. Register a parent user
  console.log('\n1. Registering a parent user');
  const parentRegistration = {
    username: `parent_${timestamp}`,
    password: 'secure_password',
    displayName: 'Example Parent',
    role: UserRole.Parent,
  };
  
  const parentResult = authService.register(parentRegistration);
  if (!parentResult.success || !parentResult.token) {
    console.error('Failed to register parent user:', parentResult.error);
    return;
  }
  
  console.log('Parent registered successfully:', parentResult.user?.username);
  const parentToken = parentResult.token.token;
  const parentId = parentResult.user?.id as string;
  
  // 2. Register a child user
  console.log('\n2. Registering a child user');
  const childRegistration = {
    username: `child_${timestamp}`,
    password: 'child_password',
    displayName: 'Example Child',
    role: UserRole.Child,
  };
  
  const childResult = authService.register(childRegistration);
  if (!childResult.success || !childResult.token) {
    console.error('Failed to register child user:', childResult.error);
    return;
  }
  
  console.log('Child registered successfully:', childResult.user?.username);
  const childToken = childResult.token.token;
  
  // 3. Parent creates a story
  console.log('\n3. Parent creates a story');
  const storyTitle = 'My First Story';
  const storyContent = 'Once upon a time, there was a brave adventurer who explored the world of coding...';
  
  const storyCreated = await createStory(parentToken, storyTitle, storyContent);
  if (!storyCreated) {
    console.error('Failed to create story');
    return;
  }
  
  // Get the story ID from the metadata files
  const userContentDir = `content/${parentId}`;
  const storyDirs = storage.listFiles(userContentDir);
  if (storyDirs.length === 0) {
    console.error('No stories found');
    return;
  }
  
  const storyId = storyDirs[0];
  console.log(`Story created with ID: ${storyId}`);
  
  // 4. Parent reads their own story
  console.log('\n4. Parent reads their own story');
  const parentReading = await readStory(parentToken, parentId, storyId);
  if (parentReading) {
    console.log('Story content:', parentReading);
  }
  
  // 5. Child tries to read parent's story (should fail)
  console.log('\n5. Child tries to read parent\'s story (should fail)');
  const childReading = await readStory(childToken, parentId, storyId);
  if (!childReading) {
    console.log('Child access correctly denied');
  }
  
  // 6. Anonymous access attempt (should fail)
  console.log('\n6. Anonymous access attempt (should fail)');
  const anonymousReading = await readStory(null, parentId, storyId);
  if (!anonymousReading) {
    console.log('Anonymous access correctly denied');
  }
  
  // 7. Parent logs out
  console.log('\n7. Parent logs out');
  const logoutResult = authService.logout(parentToken);
  console.log('Logout successful:', logoutResult);
  
  // 8. Try to use the token after logout (should fail)
  console.log('\n8. Try to use the token after logout (should fail)');
  const afterLogoutReading = await readStory(parentToken, parentId, storyId);
  if (!afterLogoutReading) {
    console.log('Token correctly invalidated after logout');
  }
  
  console.log('\n------------- Integration Example Completed -------------');
}

// Run the example
runExample().catch(error => {
  console.error('Error running example:', error);
}); 