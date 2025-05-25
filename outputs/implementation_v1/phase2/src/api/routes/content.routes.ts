import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { contentService } from '../services';

const router = Router();

// GET /api/content - Get all content
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const contents = await contentService.findAll();
    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/content/:id - Get content by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const content = await contentService.findById(id);
    
    if (!content) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Content not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/content - Create new content
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const contentData = req.body;
    
    // Ensure authorId is set to the authenticated user
    contentData.authorId = req.user?.id;
    
    const content = await contentService.create(contentData);
    
    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/content/:id - Update content
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Get the existing content to check ownership
    const existingContent = await contentService.findById(id);
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Content not found'
      });
      return;
    }
    
    // Only allow the author or admin to update content
    if (existingContent.authorId !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to update this content'
      });
      return;
    }
    
    const updatedContent = await contentService.update(id, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedContent
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/content/:id - Delete content
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the existing content to check ownership
    const existingContent = await contentService.findById(id);
    if (!existingContent) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Content not found'
      });
      return;
    }
    
    // Only allow the author or admin to delete content
    if (existingContent.authorId !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to delete this content'
      });
      return;
    }
    
    await contentService.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to delete content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/content/author/:authorId - Get content by author
router.get('/author/:authorId', authenticate, async (req: Request, res: Response) => {
  try {
    const { authorId } = req.params;
    
    // Only allow users to view their own content or admins to view any content
    if (authorId !== req.user?.id && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'You do not have permission to view this content'
      });
      return;
    }
    
    const contents = await contentService.findByAuthor(authorId);
    
    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/content/search - Search content
router.post('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Search query is required'
      });
      return;
    }
    
    const contents = await contentService.search(query);
    
    res.status(200).json({
      success: true,
      data: contents
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search content',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 