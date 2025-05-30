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
    setProgress(prevProgress => {
      if (!prevProgress) return null;
      const updatedProgress = progressService.updateStepStatus(prevProgress, stepId, status, capturedData);
      storageService.saveUserProgress(updatedProgress);
      return updatedProgress;
    });
  }, []); // progressService and storageService are stable

  const activateStep = useCallback((stepId: string) => {
    if (!progress) return;

    if (progressService.canActivateStep(progress, stepId)) {
      updateStepStatus(stepId, 'in_progress');
    }
  }, [progress, updateStepStatus]);

  const completeCurrentStep = useCallback((capturedData?: CapturedData[]) => {
    setProgress(prevProgress => {
      if (!prevProgress) return null;

      // Update current step to 'complete'
      const progressAfterComplete = progressService.updateStepStatus(prevProgress, prevProgress.currentStepId, 'complete', capturedData);
      storageService.saveUserProgress(progressAfterComplete);

      const nextStepId = progressService.getNextStep(progressAfterComplete);
      if (nextStepId) {
        setTimeout(() => {
          // updateStepStatus is the memoized one, uses functional setProgress
          updateStepStatus(nextStepId, 'in_progress');
        }, 300);
      }
      return progressAfterComplete;
    });
  }, [updateStepStatus]);

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

  const updateStepConversationId = useCallback(
    (stepId: string, conversationId: string) => {
      setProgress(prevProgress => {
        if (!prevProgress) return null;
        const updatedProgress = progressService.updateStepConversationId(
          prevProgress,
          stepId,
          conversationId
        );
        storageService.saveUserProgress(updatedProgress);
        return updatedProgress;
      });
    },
    [] // progressService and storageService are stable
  );

  const updateStepConversationProgress = useCallback(
    (
      stepId: string,
      progressData: { stepStatus?: StepStatus, analysis?: any[]; success?: boolean; conversationStatus?: string }
    ) => {
      setProgress(prevProgress => {
        if (!prevProgress) return null;

        const updatedProgress = progressService.updateStepConversationProgress(
          prevProgress,
          stepId,
          progressData
        );
        
        storageService.saveUserProgress(updatedProgress);
        
        console.log("Updated Progress (inside hook):", updatedProgress);
        console.log("Step status after update (inside hook):", updatedProgress.stepProgress[stepId]?.status);

        // If the conversation was successful and it completed the step, check for next step
        if (
          progressData.success &&
          updatedProgress.stepProgress[stepId]?.status === "complete"
        ) {
          const nextStepId = progressService.getNextStep(updatedProgress);
          if (nextStepId) {
            setTimeout(() => updateStepStatus(nextStepId, "in_progress"), 300);
          }
        }
        return updatedProgress; // Return the new state
      });
    },
    [updateStepStatus] // updateStepStatus is a stable dependency
  );

  return {
    progress,
    loading,
    updateStepStatus,
    activateStep,
    completeCurrentStep,
    canActivateStep,
    resetProgress,
    updateStepConversationId,
    updateStepConversationProgress
  };
};
