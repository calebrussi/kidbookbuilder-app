/**
 * Phase 3 API Entry Point
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { json, urlencoded } from 'express';

// Initialize services
import './services';

// Import route handlers
import templateRoutes from './routes/template.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(json());
app.use(urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', phase: 'Phase 3: Primary Feature Implementation' });
});

// API routes
app.use('/api/templates', templateRoutes);
// app.use('/api/collaboration', collaborationRoutes);
// app.use('/api/generation', generationRoutes);
// app.use('/api/feedback', feedbackRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal server error'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Phase 3 API server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}/health`);
}); 