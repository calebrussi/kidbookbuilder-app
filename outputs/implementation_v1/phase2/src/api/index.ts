import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { join } from 'path';

// Import routes
import userRoutes from './routes/user.routes';
import contentRoutes from './routes/content.routes';
import publishingRoutes from './routes/publishing.routes';
import authRoutes from './routes/auth.routes';

// Initialize services
import './services';

// Set up Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/static', express.static(join(__dirname, '../../storage')));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/auth', authRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handling
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.url}`
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
});

export default app; 