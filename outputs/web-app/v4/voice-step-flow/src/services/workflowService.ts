import { Workflow } from '../types/workflow';

// Fetch workflow.json from the API endpoint instead of importing the local file
class WorkflowService {
  private workflow: Workflow | null = null;

  async loadWorkflow(name?: string, passcode?: string): Promise<Workflow> {
    // Don't return cached workflow if we have explicit credentials (fresh login)
    // if (this.workflow && !name && !passcode) return this.workflow;
    if (this.workflow && !name) return this.workflow;

    try {
      // Get auth credentials - either from parameters or localStorage
      let authName = name;
      let authPasscode = passcode;
      
      if (!authName) {
        const storedAuth = localStorage.getItem('quiz-auth');
        if (storedAuth) {
          try {
            const authData = JSON.parse(storedAuth);
            authName = authData.userName;
            // authPasscode = authData.passcode;
          } catch (error) {
            throw new Error('Invalid stored authentication data');
          }
        }
      }

      if (!authName) {
        throw new Error('Username is required');
      }

      // Fetch from API endpoint with authentication
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const requestBody: any = { name: authName };
      
      // Only include passcode if provided
      if (authPasscode) {
        requestBody.passcode = authPasscode;
      }
      
      const response = await fetch(`${apiBaseUrl}/api/workflow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        throw new Error(errorData.message || 'Failed to fetch workflow from API');
      }
      
      const workflowData = await response.json();
      this.workflow = {
        ...workflowData,
        createdAt: new Date(workflowData.createdAt),
        updatedAt: new Date(workflowData.updatedAt)
      } as Workflow;
      return this.workflow;
    } catch (error) {
      console.error('Failed to load workflow:', error);
      throw new Error(error instanceof Error ? error.message : 'Unable to load workflow data');
    }
  }

  getWorkflow(): Workflow | null {
    return this.workflow;
  }

  resetWorkflow(): void {
    this.workflow = null;
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
