/**
 * Template Service
 * Handles template management operations
 */

import { 
  StoryTemplate, 
  TemplateCreateInput, 
  TemplateUpdateInput, 
  createStoryTemplate 
} from '../../models/template.model';

// In-memory storage for development
// Replace with database in production
const templates: Map<string, StoryTemplate> = new Map();
const userTemplateMap: Map<string, Set<string>> = new Map();

export class TemplateService {
  /**
   * Create a new template
   */
  async create(input: TemplateCreateInput): Promise<StoryTemplate> {
    // Create template
    const template = createStoryTemplate(input);
    
    // Store template
    templates.set(template.id, template);
    
    // Add to user's template list
    if (!userTemplateMap.has(input.authorId)) {
      userTemplateMap.set(input.authorId, new Set());
    }
    userTemplateMap.get(input.authorId)?.add(template.id);
    
    return template;
  }
  
  /**
   * Find template by ID
   */
  async findById(id: string): Promise<StoryTemplate | null> {
    return templates.get(id) || null;
  }
  
  /**
   * Get all templates
   */
  async findAll(): Promise<StoryTemplate[]> {
    return Array.from(templates.values());
  }
  
  /**
   * Get templates by author ID
   */
  async findByAuthor(authorId: string): Promise<StoryTemplate[]> {
    const templateIds = userTemplateMap.get(authorId) || new Set();
    return Array.from(templateIds).map(id => templates.get(id)).filter(Boolean) as StoryTemplate[];
  }
  
  /**
   * Get public templates
   */
  async findPublic(): Promise<StoryTemplate[]> {
    return Array.from(templates.values()).filter(template => template.isPublic);
  }
  
  /**
   * Update template
   */
  async update(id: string, input: TemplateUpdateInput): Promise<StoryTemplate> {
    // Check if template exists
    const existingTemplate = templates.get(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }
    
    // Update template
    const updatedTemplate: StoryTemplate = {
      ...existingTemplate,
      ...(input.name && { name: input.name }),
      ...(input.description && { description: input.description }),
      ...(input.targetAgeRange && { targetAgeRange: input.targetAgeRange }),
      ...(input.coverImage && { coverImage: input.coverImage }),
      ...(input.sections && { sections: input.sections }),
      ...(input.suggestedMedia && { suggestedMedia: input.suggestedMedia }),
      ...(input.themeTags && { themeTags: input.themeTags }),
      ...(typeof input.isPublic === 'boolean' && { isPublic: input.isPublic }),
      updatedAt: new Date()
    };
    
    // Store updated template
    templates.set(id, updatedTemplate);
    
    return updatedTemplate;
  }
  
  /**
   * Delete template
   */
  async delete(id: string): Promise<boolean> {
    // Check if template exists
    const existingTemplate = templates.get(id);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }
    
    // Remove template
    templates.delete(id);
    
    // Remove from user's template list
    const userTemplates = userTemplateMap.get(existingTemplate.authorId);
    if (userTemplates) {
      userTemplates.delete(id);
    }
    
    return true;
  }
  
  /**
   * Search templates by name, description, or theme tags
   */
  async search(query: string): Promise<StoryTemplate[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const lowercaseQuery = query.toLowerCase();
    
    return Array.from(templates.values()).filter(template => 
      template.name.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.themeTags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  /**
   * Find templates by age range
   */
  async findByAgeRange(minAge: number, maxAge: number): Promise<StoryTemplate[]> {
    return Array.from(templates.values()).filter(template => 
      template.targetAgeRange[0] <= maxAge && template.targetAgeRange[1] >= minAge
    );
  }
} 