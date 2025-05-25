/**
 * Publishing Model
 * Defines publishing-related data structures and interfaces
 */

import { v4 as uuidv4 } from 'uuid';
import { ContentType } from './content.model';

export type PublishingJobStatus = 'queued' | 'processing' | 'published' | 'failed' | 'canceled';
export type PublishingFormat = 'ebook' | 'pdf' | 'audio' | 'video' | 'web';
export type DistributionChannel = 'website' | 'app' | 'social' | 'email' | 'print';

export interface PublishingJob {
  id: string;
  contentId: string;
  title: string;
  type: ContentType;
  formats: PublishingFormat[];
  channels: DistributionChannel[];
  status: PublishingJobStatus;
  createdBy: string;
  submittedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  metadata: PublishingMetadata;
}

export interface PublishingMetadata {
  priority: 'low' | 'normal' | 'high';
  estimatedCompletionTime?: Date;
  processingSteps: PublishingStep[];
  distributionSettings: Partial<Record<DistributionChannel, any>>;
}

export interface PublishingStep {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  message?: string;
}

export interface PublishingResult {
  jobId: string;
  contentId: string;
  status: 'success' | 'partial' | 'failed';
  publishedUrls: Partial<Record<DistributionChannel, string>>;
  completedAt: Date;
  analytics?: PublishingAnalytics;
}

export interface PublishingAnalytics {
  processingTimeSeconds: number;
  fileSize: number;
  errorCount: number;
  warningCount: number;
}

export interface PublishingJobCreateInput {
  contentId: string;
  title: string;
  type: ContentType;
  formats: PublishingFormat[];
  channels: DistributionChannel[];
  createdBy: string;
  priority?: 'low' | 'normal' | 'high';
  distributionSettings?: Partial<Record<DistributionChannel, any>>;
}

export interface PublishingJobUpdateInput {
  formats?: PublishingFormat[];
  channels?: DistributionChannel[];
  status?: PublishingJobStatus;
  priority?: 'low' | 'normal' | 'high';
  distributionSettings?: Partial<Record<DistributionChannel, any>>;
  errorMessage?: string;
}

export const createNewPublishingJob = (input: PublishingJobCreateInput): PublishingJob => {
  const now = new Date();
  return {
    id: uuidv4(),
    contentId: input.contentId,
    title: input.title,
    type: input.type,
    formats: input.formats,
    channels: input.channels,
    status: 'queued',
    createdBy: input.createdBy,
    submittedAt: now,
    metadata: {
      priority: input.priority || 'normal',
      processingSteps: getDefaultProcessingSteps(input.type, input.formats),
      distributionSettings: input.distributionSettings || getDefaultDistributionSettings(input.channels)
    }
  };
};

// Helper function to get default processing steps based on content type and formats
const getDefaultProcessingSteps = (contentType: ContentType, formats: PublishingFormat[]): PublishingStep[] => {
  const steps: PublishingStep[] = [
    { name: 'validation', status: 'pending' },
    { name: 'preparation', status: 'pending' }
  ];
  
  // Add type-specific steps
  switch (contentType) {
    case 'story':
      steps.push({ name: 'formatting', status: 'pending' });
      if (formats.includes('ebook')) {
        steps.push({ name: 'ebook-conversion', status: 'pending' });
      }
      if (formats.includes('pdf')) {
        steps.push({ name: 'pdf-generation', status: 'pending' });
      }
      break;
    case 'podcast':
      steps.push({ name: 'audio-processing', status: 'pending' });
      if (formats.includes('web')) {
        steps.push({ name: 'web-player-generation', status: 'pending' });
      }
      break;
    case 'video':
      steps.push({ name: 'video-processing', status: 'pending' });
      steps.push({ name: 'thumbnail-generation', status: 'pending' });
      break;
  }
  
  // Add common final steps
  steps.push(
    { name: 'optimization', status: 'pending' },
    { name: 'distribution', status: 'pending' }
  );
  
  return steps;
};

// Helper function to get default distribution settings
const getDefaultDistributionSettings = (channels: DistributionChannel[]): Partial<Record<DistributionChannel, any>> => {
  const settings: Partial<Record<DistributionChannel, any>> = {};
  
  channels.forEach(channel => {
    switch (channel) {
      case 'website':
        settings[channel] = { featured: false, category: 'general' };
        break;
      case 'app':
        settings[channel] = { notifyUsers: true };
        break;
      case 'social':
        settings[channel] = { platforms: ['twitter', 'facebook'] };
        break;
      case 'email':
        settings[channel] = { sendNewsletter: true };
        break;
      case 'print':
        settings[channel] = { copies: 10, format: 'standard' };
        break;
    }
  });
  
  return settings;
}; 