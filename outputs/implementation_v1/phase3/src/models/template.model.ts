/**
 * Template Model
 * Defines the structure for story templates
 */

import { v4 as uuidv4 } from 'uuid';

export interface TemplateSection {
  id: string;
  title: string;
  description: string;
  order: number;
  required: boolean;
  promptQuestions?: string[];
}

export interface TemplateMedia {
  id: string;
  type: 'image' | 'audio' | 'video';
  description: string;
  required: boolean;
  position: string; // e.g., 'header', 'section:123', 'footer'
}

export interface StoryTemplate {
  id: string;
  name: string;
  description: string;
  targetAgeRange: [number, number]; // min and max age
  coverImage?: string;
  sections: TemplateSection[];
  suggestedMedia: TemplateMedia[];
  themeTags: string[];
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  authorId: string;
}

export type TemplateCreateInput = Omit<StoryTemplate, 'id' | 'createdAt' | 'updatedAt'>;

export type TemplateUpdateInput = Partial<Omit<StoryTemplate, 'id' | 'createdAt' | 'updatedAt'>>;

/**
 * Create a new template section
 */
export function createTemplateSection(input: Omit<TemplateSection, 'id'>): TemplateSection {
  return {
    id: uuidv4(),
    ...input
  };
}

/**
 * Create a new template media suggestion
 */
export function createTemplateMedia(input: Omit<TemplateMedia, 'id'>): TemplateMedia {
  return {
    id: uuidv4(),
    ...input
  };
}

/**
 * Create a new story template
 */
export function createStoryTemplate(input: TemplateCreateInput): StoryTemplate {
  return {
    id: uuidv4(),
    ...input,
    createdAt: new Date(),
    updatedAt: new Date()
  };
} 