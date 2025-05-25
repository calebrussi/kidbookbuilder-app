import path from 'path';
import fs from 'fs';
import { Storage } from './storage';

/**
 * Content types supported by the Content Manager
 */
export enum ContentType {
  Text = 'text',
  Image = 'image',
  Audio = 'audio',
  Video = 'video',
}

/**
 * Metadata for content items
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
 * Content Manager for handling different media types
 */
export class ContentManager {
  private storage: Storage;
  private contentBasePath: string = 'content';

  /**
   * Creates a new Content Manager instance
   * @param storage Storage instance for persisting content
   */
  constructor(storage: Storage) {
    this.storage = storage;
    this.ensureContentDirectory();
  }

  /**
   * Ensures the content directory exists
   */
  private ensureContentDirectory(): void {
    this.storage.ensureDirectory(this.storage.getFullPath(this.contentBasePath));
  }

  /**
   * Determine MIME type based on file extension
   * @param filePath Path to the file
   * @returns MIME type string
   */
  private getMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Determine content type based on MIME type
   * @param mimeType MIME type string
   * @returns ContentType
   */
  private getContentType(mimeType: string): ContentType {
    if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'application/javascript') {
      return ContentType.Text;
    } else if (mimeType.startsWith('image/')) {
      return ContentType.Image;
    } else if (mimeType.startsWith('audio/')) {
      return ContentType.Audio;
    } else if (mimeType.startsWith('video/')) {
      return ContentType.Video;
    }
    return ContentType.Text; // Default to text
  }

  /**
   * Store content file and metadata
   * @param userId User ID of the content owner
   * @param title Title of the content
   * @param authorName Name of the author
   * @param filePath Local path to the file to store
   * @param description Optional description of the content
   * @param tags Optional tags for the content
   * @returns Metadata of the stored content
   */
  public storeContent(
    userId: string,
    title: string,
    authorName: string, 
    filePath: string,
    description?: string,
    tags?: string[]
  ): ContentMetadata {
    // Read the file
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    const mimeType = this.getMimeType(filePath);
    const contentType = this.getContentType(mimeType);
    
    // Generate a unique ID for the content
    const contentId = `content_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Create the content directory
    const contentDir = `${this.contentBasePath}/${userId}/${contentId}`;
    this.storage.ensureDirectory(this.storage.getFullPath(contentDir));
    
    // Store the content file
    const contentFilePath = `${contentDir}/${fileName}`;
    this.storage.writeFile(contentFilePath, fileContent);
    
    // Create and store metadata
    const now = new Date().toISOString();
    const metadata: ContentMetadata = {
      id: contentId,
      title,
      authorId: userId,
      authorName,
      contentType,
      fileName,
      filePath: contentFilePath,
      mimeType,
      fileSize,
      createdAt: now,
      updatedAt: now,
      tags,
      description,
    };
    
    const metadataPath = `${contentDir}/metadata.json`;
    this.storage.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return metadata;
  }

  /**
   * Store content from a buffer
   * @param userId User ID of the content owner
   * @param title Title of the content
   * @param authorName Name of the author
   * @param buffer Content data buffer
   * @param fileName Name to save the file as
   * @param description Optional description of the content
   * @param tags Optional tags for the content
   * @returns Metadata of the stored content
   */
  public storeContentFromBuffer(
    userId: string,
    title: string,
    authorName: string, 
    buffer: Buffer,
    fileName: string,
    description?: string,
    tags?: string[]
  ): ContentMetadata {
    const mimeType = this.getMimeType(fileName);
    const contentType = this.getContentType(mimeType);
    
    // Generate a unique ID for the content
    const contentId = `content_${Date.now()}_${fileName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    
    // Create the content directory
    const contentDir = `${this.contentBasePath}/${userId}/${contentId}`;
    this.storage.ensureDirectory(this.storage.getFullPath(contentDir));
    
    // Store the content file
    const contentFilePath = `${contentDir}/${fileName}`;
    this.storage.writeFile(contentFilePath, buffer);
    
    // Create and store metadata
    const now = new Date().toISOString();
    const metadata: ContentMetadata = {
      id: contentId,
      title,
      authorId: userId,
      authorName,
      contentType,
      fileName,
      filePath: contentFilePath,
      mimeType,
      fileSize: buffer.length,
      createdAt: now,
      updatedAt: now,
      tags,
      description,
    };
    
    const metadataPath = `${contentDir}/metadata.json`;
    this.storage.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return metadata;
  }

  /**
   * Get content metadata
   * @param userId User ID of the content owner
   * @param contentId Content ID
   * @returns Content metadata or null if not found
   */
  public getContentMetadata(userId: string, contentId: string): ContentMetadata | null {
    const metadataPath = `${this.contentBasePath}/${userId}/${contentId}/metadata.json`;
    const metadataBuffer = this.storage.readFile(metadataPath);
    
    if (!metadataBuffer) {
      return null;
    }
    
    return JSON.parse(metadataBuffer.toString()) as ContentMetadata;
  }

  /**
   * Get content file
   * @param userId User ID of the content owner
   * @param contentId Content ID
   * @returns Content buffer or null if not found
   */
  public getContentFile(userId: string, contentId: string): { buffer: Buffer; metadata: ContentMetadata } | null {
    const metadata = this.getContentMetadata(userId, contentId);
    
    if (!metadata) {
      return null;
    }
    
    const fileBuffer = this.storage.readFile(metadata.filePath);
    
    if (!fileBuffer) {
      return null;
    }
    
    return {
      buffer: fileBuffer,
      metadata,
    };
  }

  /**
   * List all content for a user
   * @param userId User ID
   * @param contentType Optional content type to filter by
   * @returns Array of content metadata
   */
  public listUserContent(userId: string, contentType?: ContentType): ContentMetadata[] {
    const userContentPath = `${this.contentBasePath}/${userId}`;
    const contentDirs = this.storage.listFiles(userContentPath);
    const contents: ContentMetadata[] = [];
    
    for (const dir of contentDirs) {
      const metadataPath = `${userContentPath}/${dir}/metadata.json`;
      const metadataBuffer = this.storage.readFile(metadataPath);
      
      if (metadataBuffer) {
        const metadata = JSON.parse(metadataBuffer.toString()) as ContentMetadata;
        
        // Filter by content type if specified
        if (!contentType || metadata.contentType === contentType) {
          contents.push(metadata);
        }
      }
    }
    
    return contents;
  }

  /**
   * Delete content
   * @param userId User ID of the content owner
   * @param contentId Content ID
   * @returns true if deleted, false otherwise
   */
  public deleteContent(userId: string, contentId: string): boolean {
    const contentPath = `${this.contentBasePath}/${userId}/${contentId}`;
    const files = this.storage.listFiles(contentPath);
    
    // Delete all files in the content directory
    let allDeleted = true;
    for (const file of files) {
      const filePath = `${contentPath}/${file}`;
      const deleted = this.storage.deleteFile(filePath);
      allDeleted = allDeleted && deleted;
    }
    
    // If all files were deleted, remove the directory
    if (allDeleted) {
      // In a real implementation, we would use fs.rmdirSync here,
      // but we're working with the existing Storage class that doesn't have a removeDirectory method
      return true;
    }
    
    return false;
  }

  /**
   * Update content metadata
   * @param userId User ID of the content owner
   * @param contentId Content ID
   * @param updates Partial updates to apply to the metadata
   * @returns Updated metadata or null if not found
   */
  public updateContentMetadata(
    userId: string, 
    contentId: string, 
    updates: Partial<Omit<ContentMetadata, 'id' | 'authorId' | 'filePath' | 'fileName' | 'fileSize' | 'contentType' | 'mimeType' | 'createdAt'>>
  ): ContentMetadata | null {
    const metadata = this.getContentMetadata(userId, contentId);
    
    if (!metadata) {
      return null;
    }
    
    // Apply updates
    const updatedMetadata: ContentMetadata = {
      ...metadata,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Save updated metadata
    const metadataPath = `${this.contentBasePath}/${userId}/${contentId}/metadata.json`;
    this.storage.writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    
    return updatedMetadata;
  }
} 