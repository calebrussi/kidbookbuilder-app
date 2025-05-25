import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { publishingService, contentService } from '../services';

const router = Router();

// GET /api/publishing - Get all publishing jobs
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    let jobs;
    
    // Admin can see all jobs, others see only their own
    if (req.user?.role === 'admin') {
      jobs = await publishingService.findAllJobs();
    } else {
      jobs = await publishingService.findJobsByUser(req.user?.id || '');
    }
    
    res.status(200).json({
      success: true,
      data: jobs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve publishing jobs',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/publishing/:id - Get publishing job by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const job = await publishingService.findJobById(id);
    
    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publishing job not found'
      });
      return;
    }
    
    // Check if user has permission to view this job
    if (job.createdBy !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this job'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve publishing job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/publishing - Create new publishing job
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const jobData = req.body;
    
    // Set creator ID to authenticated user
    jobData.createdBy = req.user?.id;
    
    // Verify content exists and user has permission
    const content = await contentService.findById(jobData.contentId);
    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Content not found'
      });
      return;
    }
    
    // Check if user has permission to publish this content
    if (content.authorId !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to publish this content'
      });
      return;
    }
    
    const job = await publishingService.createJob(jobData);
    
    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create publishing job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/publishing/:id - Update publishing job
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Check if job exists
    const existingJob = await publishingService.findJobById(id);
    if (!existingJob) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publishing job not found'
      });
      return;
    }
    
    // Check if user has permission to update this job
    if (existingJob.createdBy !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this job'
      });
      return;
    }
    
    const updatedJob = await publishingService.updateJob(id, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedJob
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update publishing job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/publishing/:id - Delete publishing job
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await publishingService.findJobById(id);
    if (!existingJob) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publishing job not found'
      });
      return;
    }
    
    // Check if user has permission to delete this job
    if (existingJob.createdBy !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this job'
      });
      return;
    }
    
    await publishingService.deleteJob(id);
    
    res.status(200).json({
      success: true,
      message: 'Publishing job deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to delete publishing job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/publishing/:id/process - Process a publishing job
router.post('/:id/process', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await publishingService.findJobById(id);
    if (!existingJob) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publishing job not found'
      });
      return;
    }
    
    // Only admins or editors can process jobs
    if (req.user?.role !== 'admin' && req.user?.role !== 'editor') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to process this job'
      });
      return;
    }
    
    const result = await publishingService.processJob(id);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to process publishing job',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/publishing/:id/result - Get publishing result
router.get('/:id/result', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if job exists
    const existingJob = await publishingService.findJobById(id);
    if (!existingJob) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Publishing job not found'
      });
      return;
    }
    
    // Check if user has permission to view this job result
    if (existingJob.createdBy !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this job result'
      });
      return;
    }
    
    const result = await publishingService.getJobResult(id);
    
    if (!result) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'No result available for this job'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve publishing result',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 