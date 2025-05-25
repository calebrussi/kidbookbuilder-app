/**
 * Services initialization for Phase 3
 */

import { TemplateService } from '../services/template/template.service';

// Template Service
export const templateService = new TemplateService();

// Additional services will be initialized here as they are developed:
// export const collaborationService = new CollaborationService();
// export const generationService = new GenerationService();
// export const feedbackService = new FeedbackService();

console.log('Phase 3 services initialized'); 