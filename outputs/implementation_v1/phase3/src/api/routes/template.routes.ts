import { Router, Request, Response } from 'express';
import { templateService } from '../services';

const router = Router();

// GET /api/templates/public-templates - Get public templates
router.get('/public-templates', async (req: Request, res: Response, next) => {
  try {
    const templates = await templateService.findPublic();
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve public templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/templates/by-author/:authorId - Get templates by author ID
router.get('/by-author/:authorId', async (req: Request, res: Response, next) => {
  try {
    const { authorId } = req.params;
    
    const templates = await templateService.findByAuthor(authorId);
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/templates - Get all templates
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const templates = await templateService.findAll();
    
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve templates',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/templates - Create new template
router.post('/', async (req: Request, res: Response, next) => {
  try {
    const templateData = req.body;
    
    // Validate required fields
    if (!templateData.name || !templateData.authorId) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name and authorId are required fields'
      });
      return;
    }
    
    // Create template
    const template = await templateService.create(templateData);
    
    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/templates/:id - Get template by ID
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    
    const template = await templateService.findById(id);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Template not found'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/templates/:id - Update template
router.put('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Update template
    const updatedTemplate = await templateService.update(id, updateData);
    
    res.status(200).json({
      success: true,
      data: updatedTemplate
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/templates/:id - Delete template
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const { id } = req.params;
    
    // Delete template
    await templateService.delete(id);
    
    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to delete template',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 