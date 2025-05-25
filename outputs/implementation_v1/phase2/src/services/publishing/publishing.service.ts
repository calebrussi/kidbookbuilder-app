/**
 * Publishing Service
 * Handles publishing workflows for content
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  PublishingJob,
  PublishingJobCreateInput,
  PublishingJobUpdateInput,
  PublishingResult,
  createNewPublishingJob,
  PublishingJobStatus,
  PublishingStep
} from '../../models/publishing.model';
import { ContentService } from '../content/content.service';
import { Content, canPublishContent } from '../../models/content.model';

// In-memory storage for development
// Replace with database in production
const publishingJobs: Map<string, PublishingJob> = new Map();
const contentJobsMap: Map<string, Set<string>> = new Map();
const userJobsMap: Map<string, Set<string>> = new Map();
const publishingResults: Map<string, PublishingResult> = new Map();

export class PublishingService {
  private contentService: ContentService;
  
  constructor(contentService: ContentService) {
    this.contentService = contentService;
  }
  
  /**
   * Create a new publishing job
   */
  async createJob(input: PublishingJobCreateInput): Promise<PublishingJob> {
    // Get the content to validate
    const content = await this.contentService.findById(input.contentId);
    if (!content) {
      throw new Error('Content not found');
    }
    
    // Check if content can be published
    if (!canPublishContent(content)) {
      throw new Error('Content is not ready for publishing');
    }
    
    // Create job
    const job = createNewPublishingJob(input);
    
    // Store job
    publishingJobs.set(job.id, job);
    
    // Add to content's jobs list
    if (!contentJobsMap.has(input.contentId)) {
      contentJobsMap.set(input.contentId, new Set());
    }
    contentJobsMap.get(input.contentId)?.add(job.id);
    
    // Add to user's jobs list
    if (!userJobsMap.has(input.createdBy)) {
      userJobsMap.set(input.createdBy, new Set());
    }
    userJobsMap.get(input.createdBy)?.add(job.id);
    
    return job;
  }
  
  /**
   * Find job by ID
   */
  async findJobById(id: string): Promise<PublishingJob | null> {
    return publishingJobs.get(id) || null;
  }
  
  /**
   * Get all jobs
   */
  async findAllJobs(): Promise<PublishingJob[]> {
    return Array.from(publishingJobs.values());
  }
  
  /**
   * Get jobs by content ID
   */
  async findJobsByContent(contentId: string): Promise<PublishingJob[]> {
    const jobIds = contentJobsMap.get(contentId) || new Set();
    return Array.from(jobIds).map(id => publishingJobs.get(id)).filter(Boolean) as PublishingJob[];
  }
  
  /**
   * Get jobs by user ID (creator)
   */
  async findJobsByUser(userId: string): Promise<PublishingJob[]> {
    const jobIds = userJobsMap.get(userId) || new Set();
    return Array.from(jobIds).map(id => publishingJobs.get(id)).filter(Boolean) as PublishingJob[];
  }
  
  /**
   * Get jobs by status
   */
  async findJobsByStatus(status: PublishingJobStatus): Promise<PublishingJob[]> {
    return Array.from(publishingJobs.values()).filter(job => job.status === status);
  }
  
  /**
   * Update job
   */
  async updateJob(id: string, input: PublishingJobUpdateInput): Promise<PublishingJob> {
    // Check if job exists
    const existingJob = publishingJobs.get(id);
    if (!existingJob) {
      throw new Error('Publishing job not found');
    }
    
    // Update job
    const updatedJob: PublishingJob = {
      ...existingJob,
      ...(input.formats && { formats: input.formats }),
      ...(input.channels && { channels: input.channels }),
      ...(input.status && { status: input.status }),
      metadata: {
        ...existingJob.metadata,
        ...(input.priority && { priority: input.priority }),
        ...(input.distributionSettings && { 
          distributionSettings: {
            ...existingJob.metadata.distributionSettings,
            ...input.distributionSettings
          }
        })
      },
      ...(input.status === 'processing' && !existingJob.startedAt && { startedAt: new Date() }),
      ...(
        (input.status === 'published' || input.status === 'failed') && 
        !existingJob.completedAt && 
        { completedAt: new Date() }
      )
    };
    
    // Store updated job
    publishingJobs.set(id, updatedJob);
    
    return updatedJob;
  }
  
  /**
   * Delete job
   */
  async deleteJob(id: string): Promise<boolean> {
    // Check if job exists
    const existingJob = publishingJobs.get(id);
    if (!existingJob) {
      throw new Error('Publishing job not found');
    }
    
    // Can only delete jobs that aren't in progress
    if (existingJob.status === 'processing') {
      throw new Error('Cannot delete a job in progress');
    }
    
    // Remove job
    publishingJobs.delete(id);
    
    // Remove from content's jobs list
    const contentJobs = contentJobsMap.get(existingJob.contentId);
    if (contentJobs) {
      contentJobs.delete(id);
    }
    
    // Remove from user's jobs list
    const userJobs = userJobsMap.get(existingJob.createdBy);
    if (userJobs) {
      userJobs.delete(id);
    }
    
    return true;
  }
  
  /**
   * Update step status in job
   */
  async updateJobStep(
    jobId: string, 
    stepName: string, 
    status: PublishingStep['status'],
    message?: string
  ): Promise<PublishingJob> {
    // Check if job exists
    const existingJob = publishingJobs.get(jobId);
    if (!existingJob) {
      throw new Error('Publishing job not found');
    }
    
    // Find step
    const stepIndex = existingJob.metadata.processingSteps.findIndex(step => step.name === stepName);
    if (stepIndex === -1) {
      throw new Error(`Step ${stepName} not found in job`);
    }
    
    // Update step
    const updatedSteps = [...existingJob.metadata.processingSteps];
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      status,
      ...(status === 'in-progress' && { startedAt: new Date() }),
      ...(status === 'completed' || status === 'failed' ? { completedAt: new Date() } : {}),
      ...(message && { message })
    };
    
    // Create updated job
    const updatedJob: PublishingJob = {
      ...existingJob,
      metadata: {
        ...existingJob.metadata,
        processingSteps: updatedSteps
      }
    };
    
    // Store updated job
    publishingJobs.set(jobId, updatedJob);
    
    return updatedJob;
  }
  
  /**
   * Process a publishing job (simulate the workflow)
   */
  async processJob(jobId: string): Promise<PublishingResult> {
    // Check if job exists
    const job = await this.findJobById(jobId);
    if (!job) {
      throw new Error('Publishing job not found');
    }
    
    // Check if job is already completed
    if (job.status === 'published' || job.status === 'failed') {
      throw new Error('Job is already completed');
    }
    
    // Start processing
    await this.updateJob(jobId, { status: 'processing' });
    
    try {
      // Process each step (simulate processing by updating step status)
      for (const step of job.metadata.processingSteps) {
        // Update step to in-progress
        await this.updateJobStep(jobId, step.name, 'in-progress');
        
        // Simulate processing time (would be actual processing in production)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Randomly fail some steps for demo purposes (5% chance of failure)
        const shouldFail = Math.random() < 0.05;
        if (shouldFail) {
          await this.updateJobStep(jobId, step.name, 'failed', 'Failed during processing');
          
          // Mark job as failed
          await this.updateJob(jobId, { 
            status: 'failed',
            errorMessage: `Failed at step: ${step.name}`
          });
          
          // Return failed result
          const failedResult: PublishingResult = {
            jobId,
            contentId: job.contentId,
            status: 'failed',
            publishedUrls: {},
            completedAt: new Date(),
            analytics: {
              processingTimeSeconds: 1,
              fileSize: 0,
              errorCount: 1,
              warningCount: 0
            }
          };
          
          publishingResults.set(jobId, failedResult);
          return failedResult;
        }
        
        // Mark step as completed
        await this.updateJobStep(jobId, step.name, 'completed');
      }
      
      // All steps completed successfully
      await this.updateJob(jobId, { status: 'published' });
      
      // Get the latest job state after all updates
      const completedJob = await this.findJobById(jobId);
      if (!completedJob) throw new Error('Job not found after processing');
      
      // Update content status to published
      const content = await this.contentService.findById(job.contentId);
      if (content && content.status !== 'published') {
        await this.contentService.update(content.id, { status: 'published' });
      }
      
      // Generate mock published URLs
      const publishedUrls: Record<string, string> = {};
      completedJob.channels.forEach(channel => {
        publishedUrls[channel] = `https://example.com/${channel}/${job.contentId}`;
      });
      
      // Create result
      const result: PublishingResult = {
        jobId,
        contentId: job.contentId,
        status: 'success',
        publishedUrls,
        completedAt: new Date(),
        analytics: {
          processingTimeSeconds: Math.floor(Math.random() * 60) + 10, // 10-70 seconds
          fileSize: Math.floor(Math.random() * 10000000), // Random file size
          errorCount: 0,
          warningCount: Math.floor(Math.random() * 3) // 0-2 warnings
        }
      };
      
      // Store result
      publishingResults.set(jobId, result);
      
      return result;
    } catch (error) {
      // Handle unexpected errors
      await this.updateJob(jobId, { 
        status: 'failed',
        errorMessage: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
      });
      
      // Return failed result
      const failedResult: PublishingResult = {
        jobId,
        contentId: job.contentId,
        status: 'failed',
        publishedUrls: {},
        completedAt: new Date(),
        analytics: {
          processingTimeSeconds: 1,
          fileSize: 0,
          errorCount: 1,
          warningCount: 0
        }
      };
      
      publishingResults.set(jobId, failedResult);
      return failedResult;
    }
  }
  
  /**
   * Get publishing result for a job
   */
  async getJobResult(jobId: string): Promise<PublishingResult | null> {
    return publishingResults.get(jobId) || null;
  }
} 