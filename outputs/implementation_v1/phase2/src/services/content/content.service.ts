/**
 * Content Service
 * Handles content management operations
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  Content, 
  ContentCreateInput, 
  ContentUpdateInput, 
  MediaAsset,
  createNewContent, 
  ContentType,
  ContentStatus
} from '../../models/content.model';

// In-memory storage for development
// Replace with database in production
const contents: Map<string, Content> = new Map();
const mediaAssets: Map<string, MediaAsset[]> = new Map();
const userContentMap: Map<string, Set<string>> = new Map();

export class ContentService {
  /**
   * Create new content
   */
  async create(input: ContentCreateInput): Promise<Content> {
    // Create content
    const content = createNewContent(input);
    
    // Store content
    contents.set(content.id, content);
    
    // Add to user's content list
    if (!userContentMap.has(input.authorId)) {
      userContentMap.set(input.authorId, new Set());
    }
    userContentMap.get(input.authorId)?.add(content.id);
    
    // Initialize empty media assets array
    mediaAssets.set(content.id, []);
    
    return content;
  }
  
  /**
   * Find content by ID
   */
  async findById(id: string): Promise<Content | null> {
    return contents.get(id) || null;
  }
  
  /**
   * Get all content
   */
  async findAll(): Promise<Content[]> {
    return Array.from(contents.values());
  }
  
  /**
   * Get content by author ID
   */
  async findByAuthor(authorId: string): Promise<Content[]> {
    const contentIds = userContentMap.get(authorId) || new Set();
    return Array.from(contentIds).map(id => contents.get(id)).filter(Boolean) as Content[];
  }
  
  /**
   * Find content by type
   */
  async findByType(type: ContentType): Promise<Content[]> {
    return Array.from(contents.values()).filter(content => content.type === type);
  }
  
  /**
   * Find content by status
   */
  async findByStatus(status: ContentStatus): Promise<Content[]> {
    return Array.from(contents.values()).filter(content => content.status === status);
  }
  
  /**
   * Update content
   */
  async update(id: string, input: ContentUpdateInput): Promise<Content> {
    // Check if content exists
    const existingContent = contents.get(id);
    if (!existingContent) {
      throw new Error('Content not found');
    }
    
    // Update content
    const updatedContent: Content = {
      ...existingContent,
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
      ...(input.status && { status: input.status }),
      ...(input.tags && { tags: input.tags }),
      ...(input.coverImage && { coverImage: input.coverImage }),
      metadata: input.metadata 
        ? { ...existingContent.metadata, ...input.metadata }
        : existingContent.metadata,
      updatedAt: new Date(),
      ...(input.status === 'published' && !existingContent.publishedAt && { publishedAt: new Date() })
    };
    
    // Store updated content
    contents.set(id, updatedContent);
    
    return updatedContent;
  }
  
  /**
   * Delete content
   */
  async delete(id: string): Promise<boolean> {
    // Check if content exists
    const existingContent = contents.get(id);
    if (!existingContent) {
      throw new Error('Content not found');
    }
    
    // Remove content
    contents.delete(id);
    
    // Remove from user's content list
    const userContents = userContentMap.get(existingContent.authorId);
    if (userContents) {
      userContents.delete(id);
    }
    
    // Remove media assets
    mediaAssets.delete(id);
    
    return true;
  }
  
  /**
   * Add media asset to content
   */
  async addMediaAsset(contentId: string, asset: Omit<MediaAsset, 'id'>): Promise<MediaAsset> {
    // Check if content exists
    const existingContent = contents.get(contentId);
    if (!existingContent) {
      throw new Error('Content not found');
    }
    
    // Create asset with ID
    const newAsset: MediaAsset = {
      id: uuidv4(),
      ...asset
    };
    
    // Get or initialize media assets array
    if (!mediaAssets.has(contentId)) {
      mediaAssets.set(contentId, []);
    }
    
    // Add asset
    const assets = mediaAssets.get(contentId)!;
    assets.push(newAsset);
    
    return newAsset;
  }
  
  /**
   * Get media assets for content
   */
  async getMediaAssets(contentId: string): Promise<MediaAsset[]> {
    return mediaAssets.get(contentId) || [];
  }
  
  /**
   * Search content by title, description, or tags
   */
  async search(query: string): Promise<Content[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(contents.values()).filter(content => 
      content.title.toLowerCase().includes(lowercaseQuery) ||
      content.description.toLowerCase().includes(lowercaseQuery) ||
      content.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
} 