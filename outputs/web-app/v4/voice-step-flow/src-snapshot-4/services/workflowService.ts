import { Workflow } from '../types/workflow';

// Fetch workflow.json from the API endpoint instead of importing the local file
class WorkflowService {
  private workflow: Workflow | null = null;

  async loadWorkflow(): Promise<Workflow> {
    if (this.workflow) return this.workflow;

    try {
      // Fetch from API endpoint using VITE_API_BASE_URL
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBaseUrl}/api/workflow.json`);
      if (!response.ok) throw new Error('Failed to fetch workflow.json from API');
      const workflowData = await response.json();
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
    if (!this.workflow || !Array.isArray(this.workflow.sections)) return [];
    
    const allSteps: Array<{ step: any; section: any }> = [];
    this.workflow.sections.forEach(section => {
      if (Array.isArray(section.steps)) {
        section.steps.forEach(step => {
          allSteps.push({ step, section });
        });
      }
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
