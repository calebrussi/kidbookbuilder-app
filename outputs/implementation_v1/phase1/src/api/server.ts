import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { Storage } from '../utils/storage';
import { AuthService } from '../utils/auth/auth-service';
import { ContentManager } from '../utils/content-manager';
import { UserRole } from '../utils/auth/types';
// Import routes after they're created
// import { authRouter } from './routes/auth';
// import { contentRouter } from './routes/content';

// Initialize Express app
const app = express();

// Path to the storage directory
const storagePath = path.join(__dirname, '../../../storage');

// Create the storage directory if it doesn't exist
if (!fs.existsSync(storagePath)) {
  fs.mkdirSync(storagePath, { recursive: true });
}

// Initialize services
const storage = new Storage(storagePath);
const authService = new AuthService(storage);
const contentManager = new ContentManager(storage);

// Set up middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Request logging

// Create API context to share services with routes
export interface ApiContext {
  storage: Storage;
  authService: AuthService;
  contentManager: ContentManager;
}

const apiContext: ApiContext = {
  storage,
  authService,
  contentManager,
};

// Attach context to request object
declare global {
  namespace Express {
    interface Request {
      apiContext: ApiContext;
    }
  }
}

app.use((req, res, next) => {
  req.apiContext = apiContext;
  next();
});

// Set up routes
// We'll uncomment these once the route files are created
// app.use('/api/auth', authRouter);
// app.use('/api/content', contentRouter);

// Root route
app.get('/', (_req, res) => {
  res.json({
    message: 'Kid Book Builder API is running',
    version: '0.1.0',
    docs: '/api/docs',
  });
});

// Authentication Endpoints

// Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName, email, role } = req.body;

  // Validate input
  if (!username || !password || !displayName || !role) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password, displayName, role',
    });
  }

  // Validate role
  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({
      error: 'BadRequest',
      message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}`,
    });
  }

  // Register user
  const result = authService.register({
    username,
    password,
    displayName,
    email,
    role,
  });

  if (!result.success) {
    return res.status(400).json({
      error: 'RegistrationFailed',
      message: result.error,
    });
  }

  // Return user and token
  return res.status(201).json({
    message: 'User registered successfully',
    user: result.user,
    token: result.token,
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password',
    });
  }

  // Login user
  const result = authService.login({
    username,
    password,
  });

  if (!result.success) {
    return res.status(401).json({
      error: 'AuthenticationFailed',
      message: result.error,
    });
  }

  // Return user and token
  return res.json({
    message: 'Login successful',
    user: result.user,
    token: result.token,
  });
});

// Authentication middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is missing or invalid',
    });
  }

  const token = authHeader.split(' ')[1];
  const user = authService.validateToken(token);
  
  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication token is invalid or expired',
    });
  }

  // Attach user to request
  (req as any).user = user;
  next();
};

// Get current user profile
app.get('/api/auth/me', authenticate, (req, res) => {
  return res.json({
    user: (req as any).user,
  });
});

// Content Endpoints

// List user content
app.get('/api/content', authenticate, (req, res) => {
  const userId = (req as any).user.id;
  const content = contentManager.listUserContent(userId);
  
  return res.json({
    content,
  });
});

// Get content metadata
app.get('/api/content/:contentId', authenticate, (req, res) => {
  const userId = (req as any).user.id;
  const { contentId } = req.params;
  
  const metadata = contentManager.getContentMetadata(userId, contentId);
  
  if (!metadata) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }
  
  return res.json({
    content: metadata,
  });
});

// 404 handler
app.use((_req, res) => {
  return res.status(404).json({
    error: 'Not Found',
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('API Error:', err);
  
  return res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// Export the app
export { app }; 