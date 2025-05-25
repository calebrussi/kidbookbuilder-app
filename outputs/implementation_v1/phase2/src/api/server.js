const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// Mock data
const contents = [
  {
    id: 'content-1',
    title: 'Adventure in the Forest',
    type: 'story',
    description: 'A story about a magical adventure in an enchanted forest.',
    authorId: 'author-user',
    status: 'published',
    tags: ['adventure', 'magic', 'forest'],
    createdAt: '2023-05-10T08:30:00Z',
    updatedAt: '2023-05-12T14:45:00Z'
  },
  {
    id: 'content-2',
    title: 'The Talking Animals Podcast',
    type: 'podcast',
    description: 'A fun podcast where animals talk about their daily lives.',
    authorId: 'author-user',
    status: 'review',
    tags: ['animals', 'talking', 'fun'],
    createdAt: '2023-05-15T09:20:00Z',
    updatedAt: '2023-05-15T09:20:00Z'
  },
  {
    id: 'content-3',
    title: 'Space Explorers',
    type: 'video',
    description: 'An educational video about space exploration.',
    authorId: 'admin-user',
    status: 'draft',
    tags: ['space', 'education', 'science'],
    createdAt: '2023-05-18T11:10:00Z',
    updatedAt: '2023-05-18T11:10:00Z'
  }
];

// Mock users
const users = {
  'admin-user': {
    id: 'admin-user',
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin'
  },
  'author-user': {
    id: 'author-user',
    email: 'author@example.com',
    password: 'author123',
    name: 'Author User',
    role: 'author'
  }
};

// Mock publishing jobs
const publishingJobs = [
  {
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
  {
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
  {
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
];

// Authentication routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = Object.values(users).find(u => u.email === email);
  
  // Check if user exists and password matches
  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }
  
  // Create a simple mock token
  const token = `mock-token-${user.id}-${Date.now()}`;
  
  // Return user data and token (excluding password)
  const { password: _, ...userData } = user;
  
  res.status(200).json({
    success: true,
    data: {
      user: userData,
      token
    }
  });
});

// Content routes
app.get('/api/content', (req, res) => {
  res.status(200).json({
    success: true,
    data: contents
  });
});

app.get('/api/content/:id', (req, res) => {
  const { id } = req.params;
  const content = contents.find(c => c.id === id);
  
  if (!content) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: 'Content not found'
    });
  }
  
  res.status(200).json({
    success: true,
    data: content
  });
});

// Publishing routes
app.get('/api/publishing', (req, res) => {
  res.status(200).json({
    success: true,
    data: publishingJobs
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
}); 