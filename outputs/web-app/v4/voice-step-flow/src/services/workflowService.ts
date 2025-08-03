import { Workflow } from '../types/workflow';
import { supabase } from '../lib/supabase';
import { PersonalizedAgentService } from './personalizedAgentService';

// Load workflows from Supabase database
class WorkflowService {
  private workflow: Workflow | null = null;

  async loadWorkflow(name?: string, passcode?: string): Promise<Workflow> {
    console.log('🚀 WorkflowService: Starting workflow load...');
    
    // Return cached workflow if available
    if (this.workflow && !name) {
      console.log('📦 WorkflowService: Returning cached workflow');
      return this.workflow;
    }

    try {
      console.log('👤 WorkflowService: Getting current user...');
      // Temporarily skip user check to debug workflow loading
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) {
      //   console.error('❌ WorkflowService: No user authenticated');
      //   throw new Error('User authentication required');
      // }
      console.log('✅ WorkflowService: Skipping user auth check for debugging');

      console.log('🔍 WorkflowService: Fetching workflows from database...');
      
      // Use real API workflow instead of hardcoded
      console.log('📡 WorkflowService: Fetching workflow from API...');
      
      const response = await fetch('/api/workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'character-creation-quiz', // Dummy name for API
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const apiWorkflow = await response.json();
      
      // Cache the API workflow
      this.workflow = {
        ...apiWorkflow,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Workflow;
      
      console.log('✅ WorkflowService: Using API workflow:', this.workflow);
      return this.workflow;

    } catch (error) {
      console.error('❌ WorkflowService: Failed to load workflow from API:', error);
      console.log('🔄 WorkflowService: Falling back to hardcoded workflow...');
      
      // Fallback to hardcoded workflow when API fails
      const fallbackWorkflow = {
        id: "character-creation-quiz",
        title: "Character Creation Quiz", 
        description: "Create your perfect story character through this interactive quiz",
        sections: [
          {
            id: "introduction",
            title: "Talk with Name Helper",
            order: 0,
            steps: [
              {
                id: "name",
                title: "What is your name?",
                order: 0,
                sectionId: "introduction",
                agentId: "agent_01jz94kfyffcsteqk4t0yzvb19",
              },
            ],
          },
          {
            id: "story-style", 
            title: "Talk with Story Helper",
            order: 1,
            steps: [
              {
                id: "story-preferences",
                title: "What stories do you love?",
                order: 1,
                sectionId: "story-style",
                agentId: "agent_01jz94kpdjekxv5c8n41z1tbc6",
              },
            ],
          },
          {
            id: "character-creation",
            title: "Talk with Character Helper", 
            order: 2,
            steps: [
              {
                id: "character-details",
                title: "Character name, special ability, and favorite activity",
                order: 2,
                sectionId: "character-creation",
                agentId: "agent_01jz94kta6encvtk7rabyatkkb",
              },
            ],
          },
        ],
      };

      // Cache the fallback workflow
      this.workflow = {
        ...fallbackWorkflow,
        createdAt: new Date(),
        updatedAt: new Date()
      } as Workflow;
      
      console.log('✅ WorkflowService: Using fallback workflow:', this.workflow);
      return this.workflow;
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

  /**
   * Get personalized agent ID for a user and step
   */
  static async getPersonalizedAgentId(
    userId: string, 
    stepId: string, 
    userProgress?: any
  ): Promise<string> {
    try {
      // Extract personalization data from user's progress
      const personalization = PersonalizedAgentService.extractPersonalizationFromProgress(userProgress);
      
      // Get appropriate agent (static or dynamic)
      const agentId = await PersonalizedAgentService.getAgentForStep(
        userId, 
        stepId, 
        personalization
      );
      
      return agentId;
    } catch (error) {
      console.error(`Error getting personalized agent for ${stepId}:`, error);
      // Fallback to hardcoded agent
      return "agent_01jz94kfyffcsteqk4t0yzvb19";
    }
  }
}

export const workflowService = new WorkflowService();
