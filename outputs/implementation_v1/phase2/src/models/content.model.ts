/**
 * Content Model
 * Defines content-related data structures and interfaces
 */

import { v4 as uuidv4 } from 'uuid';

export type ContentType = 'story' | 'podcast' | 'video';
export type ContentStatus = 'draft' | 'review' | 'published' | 'archived';

export interface Content {
  id: string;
  title: string;
  description: string;
  type: ContentType;
  authorId: string;
  status: ContentStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  coverImage?: string;
  metadata: ContentMetadata;
}

export interface ContentMetadata {
  // Common metadata
  language: string;
  targetAge: number[];
  readTimeMinutes?: number;
  
  // Type-specific metadata
  storyMetadata?: StoryMetadata;
  podcastMetadata?: PodcastMetadata;
  videoMetadata?: VideoMetadata;
}

export interface StoryMetadata {
  pageCount: number;
  wordCount: number;
  illustratorId?: string;
  charactersCount?: number;
}

export interface PodcastMetadata {
  durationSeconds: number;
  episodeNumber?: number;
  seasonNumber?: number;
  hostIds?: string[];
}

export interface VideoMetadata {
  durationSeconds: number;
  resolution: string;
  aspectRatio: string;
  actorIds?: string[];
}

export interface MediaAsset {
  id: string;
  contentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
  metadata?: Record<string, any>;
}

export interface ContentCreateInput {
  title: string;
  description: string;
  type: ContentType;
  authorId: string;
  tags?: string[];
  coverImage?: string;
  metadata: Partial<ContentMetadata>;
}

export interface ContentUpdateInput {
  title?: string;
  description?: string;
  status?: ContentStatus;
  tags?: string[];
  coverImage?: string;
  metadata?: Partial<ContentMetadata>;
}

export const createNewContent = (input: ContentCreateInput): Content => {
  const now = new Date();
  return {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    type: input.type,
    authorId: input.authorId,
    status: 'draft',
    tags: input.tags || [],
    createdAt: now,
    updatedAt: now,
    coverImage: input.coverImage,
    metadata: {
      language: input.metadata.language || 'en',
      targetAge: input.metadata.targetAge || [3, 8],
      ...input.metadata
    }
  };
};

// Helper function to determine if content can be published
export const canPublishContent = (content: Content): boolean => {
  // Basic validation for publishing
  if (!content.title || content.title.trim().length < 3) return false;
  if (!content.description || content.description.trim().length < 10) return false;
  
  // Type-specific validation
  switch (content.type) {
    case 'story':
      return !!content.metadata.storyMetadata && content.metadata.storyMetadata.pageCount > 0;
    case 'podcast':
      return !!content.metadata.podcastMetadata && content.metadata.podcastMetadata.durationSeconds > 0;
    case 'video':
      return !!content.metadata.videoMetadata && content.metadata.videoMetadata.durationSeconds > 0;
    default:
      return false;
  }
}; 