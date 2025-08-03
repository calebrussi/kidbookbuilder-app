
import { useState, useEffect } from 'react';
import { Workflow } from '../types/workflow';
import { workflowService } from '../services/workflowService';

export const useWorkflow = (isAuthenticated: boolean = false, forceStoryMode: boolean = false) => {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      // Reset state when not authenticated
      setWorkflow(null);
      setError(null);
      setLoading(false);
      return;
    }

    const loadWorkflow = async () => {
      try {
        setLoading(true);
        
        // Check if we're in story creation mode
        const storyCreationMode = forceStoryMode || localStorage.getItem('storyCreationMode') === 'true';
        const storedStoryWorkflow = localStorage.getItem('storyWorkflow');
        
        let workflowData;
        
        if (storyCreationMode && storedStoryWorkflow) {
          console.log('📖 Loading story creation workflow from localStorage');
          workflowData = JSON.parse(storedStoryWorkflow);
          
          // Clear the story creation mode flag after loading but keep the workflow for refresh
          if (!forceStoryMode) {
            localStorage.removeItem('storyCreationMode');
          }
        } else {
          console.log('📋 Loading default character quiz workflow');
          workflowData = await workflowService.loadWorkflow();
        }
        
        setWorkflow(workflowData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load workflow');
        console.error('Error loading workflow:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkflow();
  }, [isAuthenticated, forceStoryMode]);

  const getAllSteps = () => workflowService.getAllSteps();
  const getStepById = (stepId: string) => workflowService.getStepById(stepId);

  return {
    workflow,
    loading,
    error,
    getAllSteps,
    getStepById
  };
};
