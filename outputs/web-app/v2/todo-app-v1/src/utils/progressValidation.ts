import { UserProgress, StepProgress } from '../types/userProgress';
import { Workflow } from '../types/workflow';

export interface ProgressValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    totalSteps: number;
    trackedSteps: number;
    completedSteps: number;
    inProgressSteps: number;
    notStartedSteps: number;
  };
}

export function validateProgress(
  progress: UserProgress, 
  workflow: Workflow
): ProgressValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Get all steps from workflow
  const allWorkflowSteps = workflow.sections.flatMap(section => section.steps);
  const progressSteps = Object.values(progress.steps);
  
  // Check if all workflow steps are tracked in progress
  const trackedStepIds = new Set(Object.keys(progress.steps));
  const workflowStepIds = new Set(allWorkflowSteps.map(step => step.id));
  
  // Missing steps in progress
  const missingSteps = allWorkflowSteps.filter(step => !trackedStepIds.has(step.id));
  if (missingSteps.length > 0) {
    errors.push(`Missing steps in progress: ${missingSteps.map(s => s.id).join(', ')}`);
  }
  
  // Extra steps in progress
  const extraSteps = Object.keys(progress.steps).filter(stepId => !workflowStepIds.has(stepId));
  if (extraSteps.length > 0) {
    warnings.push(`Extra steps in progress: ${extraSteps.join(', ')}`);
  }
  
  // Validate step data consistency
  progressSteps.forEach(stepProgress => {
    const workflowStep = allWorkflowSteps.find(s => s.id === stepProgress.stepId);
    if (workflowStep) {
      if (stepProgress.agentId !== workflowStep.agentId) {
        errors.push(`Agent ID mismatch for step ${stepProgress.stepId}: progress has ${stepProgress.agentId}, workflow has ${workflowStep.agentId}`);
      }
      if (stepProgress.sectionId !== workflowStep.sectionId) {
        errors.push(`Section ID mismatch for step ${stepProgress.stepId}: progress has ${stepProgress.sectionId}, workflow has ${workflowStep.sectionId}`);
      }
    }
  });
  
  // Check for multiple in_progress steps
  const inProgressSteps = progressSteps.filter(step => step.state === 'in_progress');
  if (inProgressSteps.length > 1) {
    warnings.push(`Multiple steps in progress: ${inProgressSteps.map(s => s.stepId).join(', ')}`);
  }
  
  // Check conversation data integrity
  progressSteps.forEach(stepProgress => {
    if (stepProgress.conversationData) {
      const convData = stepProgress.conversationData;
      if (convData.startTime && convData.endTime) {
        const startTime = new Date(convData.startTime);
        const endTime = new Date(convData.endTime);
        if (endTime <= startTime) {
          errors.push(`Invalid conversation times for step ${stepProgress.stepId}: end time not after start time`);
        }
      }
    }
  });
  
  const summary = {
    totalSteps: allWorkflowSteps.length,
    trackedSteps: progressSteps.length,
    completedSteps: progressSteps.filter(s => s.state === 'complete').length,
    inProgressSteps: progressSteps.filter(s => s.state === 'in_progress').length,
    notStartedSteps: progressSteps.filter(s => s.state === 'not_started').length,
  };
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary
  };
}

export function logProgressValidation(
  progress: UserProgress, 
  workflow: Workflow
): void {
  const validation = validateProgress(progress, workflow);
  
  console.log('📊 Progress Validation Report:');
  console.log('================================');
  console.log(`✅ Valid: ${validation.isValid}`);
  console.log(`📈 Summary:`, validation.summary);
  
  if (validation.errors.length > 0) {
    console.error('❌ Errors:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  console.log('================================');
}
