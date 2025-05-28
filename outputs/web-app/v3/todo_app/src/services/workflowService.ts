
import { Workflow } from '../types/workflow';
import workflowData from '../data/workflow.json';

class WorkflowService {
  private workflow: Workflow | null = null;

  async loadWorkflow(): Promise<Workflow> {
    if (this.workflow) return this.workflow;

    try {
      // Convert JSON dates to Date objects
      this.workflow = {
        ...workflowData,
        createdAt: new Date(workflowData.createdAt),
        updatedAt: new Date(workflowData.updatedAt)
      } as Workflow;

      return this.workflow;
    } catch (error) {
      console.error('Failed to load workflow:', error);
      throw new Error('Unable to load workflow data');
    }
  }

  getWorkflow(): Workflow | null {
    return this.workflow;
  }

  getAllSteps(): Array<{ step: any; section: any }> {
    if (!this.workflow) return [];
    
    const allSteps: Array<{ step: any; section: any }> = [];
    this.workflow.sections.forEach(section => {
      section.steps.forEach(step => {
        allSteps.push({ step, section });
      });
    });
    
    return allSteps.sort((a, b) => a.step.order - b.step.order);
  }

  getStepById(stepId: string) {
    if (!this.workflow) return null;
    
    for (const section of this.workflow.sections) {
      const step = section.steps.find(s => s.id === stepId);
      if (step) return { step, section };
    }
    
    return null;
  }
}

export const workflowService = new WorkflowService();
