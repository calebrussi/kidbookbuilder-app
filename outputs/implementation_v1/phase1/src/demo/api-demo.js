const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Create the Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware
app.use(cors());
app.use(express.json());

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../storage');
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Root route to check if the API is running
app.get('/', (req, res) => {
  res.json({
    message: 'Kid Book Builder API Demo is running',
    version: '0.1.0',
  });
});

// Sample API routes
app.get('/api/samples', (req, res) => {
  res.json({
    samples: [
      { id: 1, name: 'Sample Story 1', type: 'text' },
      { id: 2, name: 'Sample Image 1', type: 'image' },
      { id: 3, name: 'Sample Audio 1', type: 'audio' },
    ],
  });
});

// Mock users database
const users = {};

// Mock content database
const contents = {};

// Authentication middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
  }
  
  const token = authHeader.split(' ')[1];
  const tokenParts = Buffer.from(token, 'base64').toString().split(':');
  
  if (tokenParts.length !== 2) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token format',
    });
  }
  
  const username = tokenParts[0];
  
  if (!users[username]) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'User not found',
    });
  }
  
  req.user = users[username];
  next();
};

// Mock authentication
app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName, role } = req.body;
  
  // Validate input
  if (!username || !password || !displayName || !role) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password, displayName, role',
    });
  }
  
  // Check if user already exists
  if (users[username]) {
    return res.status(400).json({
      error: 'RegistrationFailed',
      message: 'Username already exists',
    });
  }
  
  // Create new user
  const userId = Date.now().toString();
  const user = {
    id: userId,
    username,
    displayName,
    role,
    createdAt: new Date().toISOString(),
  };
  
  // Store user
  users[username] = {
    ...user,
    password, // In a real app, this would be hashed
  };
  
  // Generate token
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  
  return res.status(201).json({
    message: 'User registered successfully',
    user,
    token,
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!username || !password) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Missing required fields: username, password',
    });
  }
  
  // Check if user exists and password matches
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: 'AuthenticationFailed',
      message: 'Invalid username or password',
    });
  }
  
  // Generate token
  const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
  
  return res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
    token,
  });
});

// Get user profile
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      displayName: req.user.displayName,
      role: req.user.role,
    }
  });
});

// Get user's content
app.get('/api/content', authenticate, (req, res) => {
  const { search, tag } = req.query;
  let userContents = Object.values(contents).filter(
    content => content.authorId === req.user.id
  );
  
  // Filter by search term if provided
  if (search) {
    const searchLower = search.toLowerCase();
    userContents = userContents.filter(content => 
      content.title.toLowerCase().includes(searchLower) || 
      content.description.toLowerCase().includes(searchLower)
    );
  }
  
  // Filter by tag if provided
  if (tag) {
    userContents = userContents.filter(content => 
      content.tags.some(t => t.toLowerCase() === tag.toLowerCase())
    );
  }
  
  res.json({ contents: userContents });
});

// Get content by ID
app.get('/api/content/:contentId', authenticate, (req, res) => {
  const { contentId } = req.params;
  const content = contents[contentId];
  
  if (!content) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }
  
  res.json({ content });
});

// Create content
app.post('/api/content/upload', authenticate, upload.single('file'), (req, res) => {
  let { title, contentType, description, tags } = req.body;
  let filePath = '';
  let textContent = '';
  
  // Handle file upload
  if (req.file) {
    filePath = req.file.path;
  } else if (contentType === 'text' && req.body.content) {
    // For text content, create a file from the content field
    textContent = req.body.content;
    const filename = `${Date.now()}-story.txt`;
    filePath = path.join(__dirname, '../../storage', filename);
    fs.writeFileSync(filePath, textContent);
  } else {
    // For testing with curl where formdata might be an issue
    // Just create a dummy text file
    textContent = "Test content for direct JSON request";
    const filename = `${Date.now()}-story.txt`;
    filePath = path.join(__dirname, '../../storage', filename);
    fs.writeFileSync(filePath, textContent);
  }
  
  // Parse tags if provided as string
  if (typeof tags === 'string') {
    try {
      tags = JSON.parse(tags);
    } catch (e) {
      tags = tags.split(',').map(tag => tag.trim());
    }
  } else if (!tags) {
    tags = [];
  }
  
  // Create content metadata
  const contentId = Date.now().toString();
  const content = {
    id: contentId,
    title,
    contentType,
    description: description || '',
    tags: tags || [],
    authorId: req.user.id,
    authorName: req.user.displayName,
    filePath,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  // Store content
  contents[contentId] = content;
  
  res.status(201).json({
    message: 'Content created successfully',
    contentId,
    content: {
      ...content,
      filePath: undefined, // Don't expose file path to client
    },
  });
});

// Update content
app.patch('/api/content/:contentId', authenticate, (req, res) => {
  const { contentId } = req.params;
  const content = contents[contentId];
  
  if (!content) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }
  
  if (content.authorId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to update this content',
    });
  }
  
  const { title, content: newContent, description, tags } = req.body;
  
  // Update content
  if (title) content.title = title;
  if (description) content.description = description;
  if (tags) content.tags = tags;
  if (newContent && content.contentType === 'text') {
    fs.writeFileSync(content.filePath, newContent);
  }
  
  content.updatedAt = new Date().toISOString();
  
  res.json({
    message: 'Content updated successfully',
    content: {
      ...content,
      filePath: undefined, // Don't expose file path to client
    },
  });
});

// Get content file
app.get('/api/content/:contentId/file', authenticate, (req, res) => {
  const { contentId } = req.params;
  const content = contents[contentId];
  
  if (!content) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }
  
  if (!fs.existsSync(content.filePath)) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content file not found',
    });
  }
  
  if (content.contentType === 'text') {
    const textContent = fs.readFileSync(content.filePath, 'utf8');
    res.type('text/plain').send(textContent);
  } else {
    res.sendFile(content.filePath);
  }
});

// Delete content
app.delete('/api/content/:contentId', authenticate, (req, res) => {
  const { contentId } = req.params;
  const content = contents[contentId];
  
  if (!content) {
    return res.status(404).json({
      error: 'NotFound',
      message: 'Content not found',
    });
  }
  
  if (content.authorId !== req.user.id) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'You do not have permission to delete this content',
    });
  }
  
  // Delete the file if it exists
  if (fs.existsSync(content.filePath)) {
    fs.unlinkSync(content.filePath);
  }
  
  // Remove from contents
  delete contents[contentId];
  
  res.json({
    message: 'Content deleted successfully',
  });
});

// Mock illustration generation (in a real app, this would call an AI image generation API)
app.post('/api/illustrations/generate', authenticate, (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Prompt is required for illustration generation',
    });
  }
  
  // Generate a random placeholder image URL
  // In a real implementation, this would call an external AI image generation API
  const randomColor = Math.floor(Math.random() * 16777215).toString(16);
  const imageUrl = `https://placehold.co/600x400/${randomColor}/FFFFFF?text=${encodeURIComponent(prompt.substring(0, 20))}`;
  
  // Simulate API delay
  setTimeout(() => {
    res.json({
      success: true,
      imageUrl,
      prompt,
      message: 'Illustration generated successfully'
    });
  }, 1500);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Kid Book Builder API Demo server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
}); 