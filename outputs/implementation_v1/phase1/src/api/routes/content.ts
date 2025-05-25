import express from 'express';
import multer from 'multer';
import path from 'path';
import { UserRole } from '../../utils/auth/types';
import { ContentType } from '../../utils/content-manager';
import { authMiddleware } from './auth';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = [
      // Text files
      '.txt', '.md', '.html', '.json',
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // Audio
      '.mp3', '.wav', '.ogg',
      // Video
      '.mp4', '.webm', '.mov'
    ];
    
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
  }
});

/**
 * Upload content
 * POST /api/content/upload
 */
router.post('/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'No file provided or file exceeds size limit',
    });
  }

  const { title, description, tags } = req.body;
  
  // Validate input
  if (!title) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required field: title',
    });
  }

  try {
    // Parse tags
    const parsedTags = tags ? JSON.parse(tags) : undefined;

    // Store content
    const content = req.apiContext.contentManager.storeContentFromBuffer(
      req.user.id,
      title,
      req.user.displayName,
      req.file.buffer,
      req.file.originalname,
      description,
      parsedTags
    );

    res.status(201).json({
      message: 'Content uploaded successfully',
      content,
    });
  } catch (error) {
    res.status(400).json({
      error: 'UploadFailed',
      message: error.message,
    });
  }
});

/**
 * Get content list for current user
 * GET /api/content
 */
router.get('/', authMiddleware, (req, res) => {
  // Extract content type filter from query string
  const contentTypeQuery = req.query.type as string;
  let contentType: ContentType | undefined = undefined;
  
  if (contentTypeQuery) {
    if (Object.values(ContentType).includes(contentTypeQuery as ContentType)) {
      contentType = contentTypeQuery as ContentType;
    } else {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Invalid content type. Must be one of: ${Object.values(ContentType).join(', ')}`,
      });
    }
  }

  // Get content list
  const content = req.apiContext.contentManager.listUserContent(req.user.id, contentType);

  res.json({
    content,
  });
});

/**
 * Get content for a specific user (admin or parent only)
 * GET /api/content/user/:userId
 */
router.get('/user/:userId', authMiddleware, (req, res) => {
  const { userId } = req.params;
  
  // Only admin can access other users' content
  if (req.user.id !== userId && req.user.role !== UserRole.Admin) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You can only access your own content',
    });
  }

  // Extract content type filter from query string
  const contentTypeQuery = req.query.type as string;
  let contentType: ContentType | undefined = undefined;
  
  if (contentTypeQuery) {
    if (Object.values(ContentType).includes(contentTypeQuery as ContentType)) {
      contentType = contentTypeQuery as ContentType;
    } else {
      return res.status(400).json({
        error: 'BadRequest',
        message: `Invalid content type. Must be one of: ${Object.values(ContentType).join(', ')}`,
      });
    }
  }

  // Get content list
  const content = req.apiContext.contentManager.listUserContent(userId, contentType);

  res.json({
    content,
  });
});

/**
 * Get content metadata
 * GET /api/content/:contentId
 */
router.get('/:contentId', authMiddleware, (req, res) => {
  const { contentId } = req.params;
  
  // Get content metadata
  const metadata = req.apiContext.contentManager.getContentMetadata(req.user.id, contentId);
  
  if (!metadata) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }

  res.json({
    content: metadata,
  });
});

/**
 * Get content file
 * GET /api/content/:contentId/file
 */
router.get('/:contentId/file', authMiddleware, (req, res) => {
  const { contentId } = req.params;
  
  // Get content file
  const content = req.apiContext.contentManager.getContentFile(req.user.id, contentId);
  
  if (!content) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }

  // Set content type header
  res.setHeader('Content-Type', content.metadata.mimeType);
  
  // Set filename for download
  res.setHeader('Content-Disposition', `inline; filename="${content.metadata.fileName}"`);
  
  // Send file
  res.send(content.buffer);
});

/**
 * Update content metadata
 * PATCH /api/content/:contentId
 */
router.patch('/:contentId', authMiddleware, (req, res) => {
  const { contentId } = req.params;
  const { title, description, tags } = req.body;
  
  // Validate input
  if (!title && !description && !tags) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Nothing to update. Provide at least one of: title, description, tags',
    });
  }

  // Build update object
  const updates: any = {};
  if (title) updates.title = title;
  if (description) updates.description = description;
  if (tags) updates.tags = tags;

  // Update content metadata
  const updatedMetadata = req.apiContext.contentManager.updateContentMetadata(
    req.user.id,
    contentId,
    updates
  );
  
  if (!updatedMetadata) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }

  res.json({
    message: 'Content updated successfully',
    content: updatedMetadata,
  });
});

/**
 * Delete content
 * DELETE /api/content/:contentId
 */
router.delete('/:contentId', authMiddleware, (req, res) => {
  const { contentId } = req.params;
  
  // Get content metadata first to verify ownership
  const metadata = req.apiContext.contentManager.getContentMetadata(req.user.id, contentId);
  
  if (!metadata) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }

  // Delete content
  const deleted = req.apiContext.contentManager.deleteContent(req.user.id, contentId);
  
  if (!deleted) {
    return res.status(500).json({
      error: 'DeletionFailed',
      message: 'Failed to delete content',
    });
  }

  res.json({
    message: 'Content deleted successfully',
    contentId,
  });
});

export { router as contentRouter }; 