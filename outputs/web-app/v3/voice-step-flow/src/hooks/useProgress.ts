import { useState, useEffect, useCallback } from 'react';
import { UserProgress, StepStatus, CapturedData } from '../types/userProgress';
import { storageService } from '../services/storageService';
import { progressService } from '../services/progressService';

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeProgress = () => {
      try {
        const session = storageService.getCurrentSession();
        let userProgress = storageService.getUserProgress(session.sessionId);

        if (!userProgress) {
          userProgress = progressService.createNewProgress(session.sessionId, session.workflowId);
          storageService.saveUserProgress(userProgress);
        }

        setProgress(userProgress);
      } catch (error) {
        console.error('Failed to initialize progress:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeProgress();
  }, []);

  const updateStepStatus = useCallback((stepId: string, status: StepStatus, capturedData?: CapturedData[]) => {
    if (!progress) return;

    const updatedProgress = progressService.updateStepStatus(progress, stepId, status, capturedData);
    setProgress(updatedProgress);
    storageService.saveUserProgress(updatedProgress);
  }, [progress]);

  const activateStep = useCallback((stepId: string) => {
    if (!progress) return;

    if (progressService.canActivateStep(progress, stepId)) {
      updateStepStatus(stepId, 'in_progress');
    }
  }, [progress, updateStepStatus]);

  const completeCurrentStep = useCallback((capturedData?: CapturedData[]) => {
    if (!progress) return;

    updateStepStatus(progress.currentStepId, 'complete', capturedData);
    
    const nextStepId = progressService.getNextStep(progress);
    if (nextStepId) {
      setTimeout(() => updateStepStatus(nextStepId, 'in_progress'), 300);
    }
  }, [progress, updateStepStatus]);

  const canActivateStep = useCallback((stepId: string) => {
    if (!progress) return false;
    return progressService.canActivateStep(progress, stepId);
  }, [progress]);

  const resetProgress = useCallback(() => {
    const session = storageService.getCurrentSession();
    const newProgress = progressService.createNewProgress(session.sessionId, session.workflowId);
    setProgress(newProgress);
    storageService.saveUserProgress(newProgress);
  }, []);

  return {
    progress,
    loading,
    updateStepStatus,
    activateStep,
    completeCurrentStep,
    canActivateStep,
    resetProgress
  };
};
