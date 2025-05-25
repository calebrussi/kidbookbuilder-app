import { v4 as uuidv4 } from 'uuid';

// Mock in-memory database
const contents: Record<string, any> = {
  'content-1': {
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
  'content-2': {
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
  'content-3': {
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
};

/**
 * Find all content
 */
export const findAll = async () => {
  return Object.values(contents);
};

/**
 * Find content by ID
 */
export const findById = async (id: string) => {
  return contents[id];
};

/**
 * Find content by author
 */
export const findByAuthor = async (authorId: string) => {
  return Object.values(contents).filter(content => content.authorId === authorId);
};

/**
 * Create new content
 */
export const create = async (contentData: any) => {
  // Create new content
  const newContent = {
    id: uuidv4(),
    title: contentData.title,
    type: contentData.type,
    description: contentData.description || '',
    authorId: contentData.authorId,
    status: contentData.status || 'draft',
    tags: contentData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save content
  contents[newContent.id] = newContent;
  
  return newContent;
};

/**
 * Update content
 */
export const update = async (id: string, updateData: any) => {
  // Check if content exists
  const content = contents[id];
  if (!content) {
    throw new Error('Content not found');
  }
  
  // Update content
  const updatedContent = {
    ...content,
    ...updateData,
    updatedAt: new Date().toISOString()
  };
  
  // Save content
  contents[id] = updatedContent;
  
  return updatedContent;
};

/**
 * Delete content
 */
export const delete_ = async (id: string) => {
  // Check if content exists
  if (!contents[id]) {
    throw new Error('Content not found');
  }
  
  // Delete content
  delete contents[id];
  
  return true;
};

// Workaround for naming issue with "delete" being a reserved word
export { delete_ as delete };

/**
 * Search content
 */
export const search = async (query: string) => {
  // Convert query to lowercase for case-insensitive search
  const lowercaseQuery = query.toLowerCase();
  
  // Search content by title or description
  return Object.values(contents).filter(content => {
    return content.title.toLowerCase().includes(lowercaseQuery) || 
           content.description.toLowerCase().includes(lowercaseQuery) ||
           content.tags.some((tag: string) => tag.toLowerCase().includes(lowercaseQuery));
  });
}; 