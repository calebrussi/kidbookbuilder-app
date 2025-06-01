
import { useState, useEffect } from 'react';
import { Workflow } from '../types/workflow';
import { workflowService } from '../services/workflowService';

export const useWorkflow = (isAuthenticated: boolean = false) => {
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
        const workflowData = await workflowService.loadWorkflow();
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
  }, [isAuthenticated]);

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
