import { v4 as uuidv4 } from 'uuid';

// Mock in-memory database
const publishingJobs: Record<string, any> = {
  'job-1': {
    id: 'job-1',
    contentId: 'content-1',
    title: 'Adventure in the Forest',
    type: 'story',
    formats: ['ebook', 'pdf'],
    channels: ['website', 'app'],
    status: 'published',
    createdBy: 'author-user',
    submittedAt: '2023-05-12T10:30:00Z',
    startedAt: '2023-05-12T10:35:00Z',
    completedAt: '2023-05-12T10:40:00Z'
  },
  'job-2': {
    id: 'job-2',
    contentId: 'content-2',
    title: 'The Talking Animals Podcast',
    type: 'podcast',
    formats: ['audio'],
    channels: ['website', 'app'],
    status: 'processing',
    createdBy: 'author-user',
    submittedAt: '2023-05-15T11:20:00Z',
    startedAt: '2023-05-15T11:25:00Z',
    completedAt: null
  },
  'job-3': {
    id: 'job-3',
    contentId: 'content-3',
    title: 'Space Explorers',
    type: 'video',
    formats: ['video'],
    channels: ['website'],
    status: 'queued',
    createdBy: 'admin-user',
    submittedAt: '2023-05-18T12:15:00Z',
    startedAt: null,
    completedAt: null
  }
};

// Mock in-memory database for job results
const jobResults: Record<string, any> = {
  'job-1': {
    jobId: 'job-1',
    urls: {
      ebook: 'https://example.com/ebooks/adventure-in-the-forest',
      pdf: 'https://example.com/pdfs/adventure-in-the-forest.pdf'
    },
    analytics: {
      downloads: 120,
      views: 350
    },
    createdAt: '2023-05-12T10:40:00Z'
  }
};

/**
 * Find all publishing jobs
 */
export const findAllJobs = async () => {
  return Object.values(publishingJobs);
};

/**
 * Find jobs by user
 */
export const findJobsByUser = async (userId: string) => {
  return Object.values(publishingJobs).filter(job => job.createdBy === userId);
};

/**
 * Find job by ID
 */
export const findJobById = async (id: string) => {
  return publishingJobs[id];
};

/**
 * Create a new publishing job
 */
export const createJob = async (jobData: any) => {
  // Create new job
  const newJob = {
    id: uuidv4(),
    contentId: jobData.contentId,
    title: jobData.title,
    type: jobData.type,
    formats: jobData.formats || [],
    channels: jobData.channels || [],
    status: 'queued',
    createdBy: jobData.createdBy,
    submittedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null
  };
  
  // Save job
  publishingJobs[newJob.id] = newJob;
  
  return newJob;
};

/**
 * Update a publishing job
 */
export const updateJob = async (id: string, updateData: any) => {
  // Check if job exists
  const job = publishingJobs[id];
  if (!job) {
    throw new Error('Publishing job not found');
  }
  
  // Update job
  const updatedJob = {
    ...job,
    ...updateData
  };
  
  // Save job
  publishingJobs[id] = updatedJob;
  
  return updatedJob;
};

/**
 * Delete a publishing job
 */
export const deleteJob = async (id: string) => {
  // Check if job exists
  if (!publishingJobs[id]) {
    throw new Error('Publishing job not found');
  }
  
  // Delete job
  delete publishingJobs[id];
  
  // Delete job result if exists
  if (jobResults[id]) {
    delete jobResults[id];
  }
  
  return true;
};

/**
 * Process a publishing job
 */
export const processJob = async (id: string) => {
  // Check if job exists
  const job = publishingJobs[id];
  if (!job) {
    throw new Error('Publishing job not found');
  }
  
  // Check if job is already processed
  if (job.status !== 'queued' && job.status !== 'failed') {
    throw new Error('Job is already being processed or has been completed');
  }
  
  // Update job status to processing
  job.status = 'processing';
  job.startedAt = new Date().toISOString();
  
  // Simulate job processing
  setTimeout(() => {
    // Update job status to published
    job.status = 'published';
    job.completedAt = new Date().toISOString();
    
    // Create job result
    const result = {
      jobId: id,
      urls: {},
      analytics: {
        downloads: 0,
        views: 0
      },
      createdAt: new Date().toISOString()
    };
    
    // Add URLs based on formats
    if (job.formats.includes('ebook')) {
      result.urls['ebook'] = `https://example.com/ebooks/${job.title.toLowerCase().replace(/\s+/g, '-')}`;
    }
    if (job.formats.includes('pdf')) {
      result.urls['pdf'] = `https://example.com/pdfs/${job.title.toLowerCase().replace(/\s+/g, '-')}.pdf`;
    }
    if (job.formats.includes('audio')) {
      result.urls['audio'] = `https://example.com/audio/${job.title.toLowerCase().replace(/\s+/g, '-')}.mp3`;
    }
    if (job.formats.includes('video')) {
      result.urls['video'] = `https://example.com/videos/${job.title.toLowerCase().replace(/\s+/g, '-')}.mp4`;
    }
    
    // Save job result
    jobResults[id] = result;
  }, 5000); // Simulate 5-second processing time
  
  return job;
};

/**
 * Get job result
 */
export const getJobResult = async (id: string) => {
  return jobResults[id];
}; 