/**
 * Media Content Example for Kid Book Builder Phase 1
 * 
 * This example demonstrates the use of the ContentManager to handle different media types.
 */

import path from 'path';
import fs from 'fs';
import { Storage } from '../utils/storage';
import { AuthService } from '../utils/auth/auth-service';
import { ContentManager, ContentType } from '../utils/content-manager';
import { UserRole } from '../utils/auth/types';

// Path to the storage directory
const storagePath = path.join(__dirname, '../../storage');

// Initialize storage
const storage = new Storage(storagePath);
console.log('Storage initialized at:', storagePath);

// Initialize content manager
const contentManager = new ContentManager(storage);
console.log('Content manager initialized');

// Initialize authentication service
const authService = new AuthService(storage);
console.log('Authentication service initialized');

// Create temporary test files
const tempDir = path.join(__dirname, '../../temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a text file
const textFilePath = path.join(tempDir, 'sample_text.txt');
fs.writeFileSync(textFilePath, 'This is a sample text file for our content manager test.');

// Create a simple PNG image (1x1 pixel)
const imageFilePath = path.join(tempDir, 'sample_image.png');
const pngHeader = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
  0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
  0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D, 0xB0, 0x00, 0x00, 0x00,
  0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
]);
fs.writeFileSync(imageFilePath, pngHeader);

// Create a simple audio file (empty WAV)
const audioFilePath = path.join(tempDir, 'sample_audio.wav');
const wavHeader = Buffer.from([
  0x52, 0x49, 0x46, 0x46, // "RIFF"
  0x24, 0x00, 0x00, 0x00, // Chunk size: 36 bytes
  0x57, 0x41, 0x56, 0x45, // "WAVE"
  0x66, 0x6D, 0x74, 0x20, // "fmt "
  0x10, 0x00, 0x00, 0x00, // Subchunk1 size: 16 bytes
  0x01, 0x00,             // Audio format: 1 (PCM)
  0x01, 0x00,             // Number of channels: 1
  0x44, 0xAC, 0x00, 0x00, // Sample rate: 44100
  0x88, 0x58, 0x01, 0x00, // Byte rate: 88200
  0x02, 0x00,             // Block align: 2
  0x10, 0x00,             // Bits per sample: 16
  0x64, 0x61, 0x74, 0x61, // "data"
  0x00, 0x00, 0x00, 0x00  // Subchunk2 size: 0 bytes (no audio data)
]);
fs.writeFileSync(audioFilePath, wavHeader);

// Main execution flow
async function runExample() {
  console.log('------------- Kid Book Builder Media Content Example -------------');
  
  // Generate a timestamp to make usernames unique
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
  const parentId = parentResult.user?.id as string;
  const parentName = parentResult.user?.displayName as string;
  
  // 2. Store a text content
  console.log('\n2. Storing a text content');
  const textContent = contentManager.storeContent(
    parentId,
    'My Sample Text',
    parentName,
    textFilePath,
    'This is a description for my sample text',
    ['text', 'sample']
  );
  
  console.log(`Text content stored with ID: ${textContent.id}`);
  console.log(`Content type: ${textContent.contentType}`);
  console.log(`MIME type: ${textContent.mimeType}`);
  
  // 3. Store an image content
  console.log('\n3. Storing an image content');
  const imageContent = contentManager.storeContent(
    parentId,
    'My Sample Image',
    parentName,
    imageFilePath,
    'This is a description for my sample image',
    ['image', 'sample']
  );
  
  console.log(`Image content stored with ID: ${imageContent.id}`);
  console.log(`Content type: ${imageContent.contentType}`);
  console.log(`MIME type: ${imageContent.mimeType}`);
  
  // 4. Store an audio content
  console.log('\n4. Storing an audio content');
  const audioContent = contentManager.storeContent(
    parentId,
    'My Sample Audio',
    parentName,
    audioFilePath,
    'This is a description for my sample audio',
    ['audio', 'sample']
  );
  
  console.log(`Audio content stored with ID: ${audioContent.id}`);
  console.log(`Content type: ${audioContent.contentType}`);
  console.log(`MIME type: ${audioContent.mimeType}`);
  
  // 5. List all content
  console.log('\n5. Listing all content');
  const allContent = contentManager.listUserContent(parentId);
  console.log(`Found ${allContent.length} content items`);
  
  // 6. List content by type
  console.log('\n6. Listing audio content only');
  const audioOnlyContent = contentManager.listUserContent(parentId, ContentType.Audio);
  console.log(`Found ${audioOnlyContent.length} audio content items`);
  
  // 7. Retrieve content file
  console.log('\n7. Retrieving text content');
  const retrievedContent = contentManager.getContentFile(parentId, textContent.id);
  if (retrievedContent) {
    console.log('Content retrieved successfully');
    console.log(`Content: ${retrievedContent.buffer.toString()}`);
  } else {
    console.error('Failed to retrieve content');
  }
  
  // 8. Update content metadata
  console.log('\n8. Updating content metadata');
  const updatedMetadata = contentManager.updateContentMetadata(
    parentId,
    textContent.id,
    {
      title: 'Updated Text Title',
      description: 'This description was updated',
      tags: ['text', 'sample', 'updated']
    }
  );
  
  if (updatedMetadata) {
    console.log('Metadata updated successfully');
    console.log(`New title: ${updatedMetadata.title}`);
    console.log(`New description: ${updatedMetadata.description}`);
    console.log(`New tags: ${updatedMetadata.tags?.join(', ')}`);
  } else {
    console.error('Failed to update metadata');
  }
  
  // 9. Delete content
  console.log('\n9. Deleting image content');
  const deleted = contentManager.deleteContent(parentId, imageContent.id);
  console.log(`Content deletion ${deleted ? 'successful' : 'failed'}`);
  
  // 10. Verify deletion
  console.log('\n10. Verifying deletion');
  const remainingContent = contentManager.listUserContent(parentId);
  console.log(`Remaining content count: ${remainingContent.length}`);
  console.log(`Remaining content types: ${remainingContent.map(c => c.contentType).join(', ')}`);
  
  console.log('\n------------- Media Content Example Completed -------------');
  
  // Clean up temp files
  console.log('\nCleaning up temporary files');
  try {
    fs.unlinkSync(textFilePath);
    fs.unlinkSync(imageFilePath);
    fs.unlinkSync(audioFilePath);
    fs.rmdirSync(tempDir);
    console.log('Temporary files removed');
  } catch (error) {
    console.error('Error removing temporary files:', error);
  }
}

// Run the example
runExample().catch(error => {
  console.error('Error running example:', error);
}); 