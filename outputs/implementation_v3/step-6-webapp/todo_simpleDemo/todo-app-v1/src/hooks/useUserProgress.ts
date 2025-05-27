import { useState, useEffect, useCallback } from 'react';
import { UserProgress, StepProgress, ConversationData } from '../types/userProgress';
import { StepState, Workflow } from '../types/workflow';
import { progressManager } from '../utils/progressManager';

interface UseUserProgressReturn {
  userProgress: UserProgress | null;
  stepStates: Record<string, StepState>;
  updateStepState: (stepId: string, newState: StepState) => void;
  updateConversationData: (stepId: string, conversationData: Partial<ConversationData>) => void;
  startConversation: (stepId: string, conversationId: string) => void;
  endConversation: (stepId: string, finalData?: Partial<ConversationData>) => void;
  clearProgress: () => void;
  exportProgress: () => string;
  importProgress: (data: string) => boolean;
  isLoading: boolean;
}

export const useUserProgress = (workflow: Workflow): UseUserProgressReturn => {
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize progress from storage or create new
  useEffect(() => {
    console.log('🔄 Initializing user progress for workflow:', workflow.id);
    
    const existingProgress = progressManager.loadProgress(workflow.id);
    
    if (existingProgress) {
      setUserProgress(existingProgress);
      console.log('📖 Loaded existing progress:', {
        workflowId: existingProgress.workflowId,
        stepCount: Object.keys(existingProgress.steps).length,
        lastUpdated: existingProgress.lastUpdated
      });
    } else {
      // Create new progress with all steps from workflow
      const allSteps = workflow.sections.flatMap(section => section.steps);
      const initialSteps: Record<string, StepProgress> = {};
      
      allSteps.forEach((step, index) => {
        initialSteps[step.id] = {
          stepId: step.id,
          sectionId: step.sectionId,
          agentId: step.agentId,
          state: index === 0 ? 'not_started' : 'not_started', // All steps start as not_started
          lastUpdated: new Date().toISOString()
        };
      });

      const newProgress: UserProgress = {
        workflowId: workflow.id,
        startedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        steps: initialSteps
      };

      setUserProgress(newProgress);
      progressManager.saveProgress(newProgress);
      
      console.log('📝 Created new progress:', {
        workflowId: newProgress.workflowId,
        stepCount: Object.keys(newProgress.steps).length,
        firstStepState: initialSteps[allSteps[0].id]?.state
      });
    }
    
    setIsLoading(false);
  }, [workflow.id]);

  // Create stepStates mapping for easy access
  const stepStates: Record<string, StepState> = userProgress ? 
    Object.entries(userProgress.steps).reduce((acc, [stepId, stepProgress]) => {
      acc[stepId] = stepProgress.state;
      return acc;
    }, {} as Record<string, StepState>) : {};

  // Update step state
  const updateStepState = useCallback((stepId: string, newState: StepState) => {
    setUserProgress(currentProgress => {
      if (!currentProgress) {
        console.warn('⚠️ Cannot update step state: userProgress is null');
        return currentProgress;
      }

      console.log('🔄 Updating step state:', {
        stepId,
        oldState: currentProgress.steps[stepId]?.state,
        newState,
        timestamp: new Date().toISOString()
      });

      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        steps: {
          ...currentProgress.steps,
          [stepId]: {
            ...currentProgress.steps[stepId],
            state: newState,
            lastUpdated: new Date().toISOString()
          }
        }
      };

      progressManager.saveProgress(updatedProgress);
      console.log('💾 Step state updated and saved to storage');
      
      return updatedProgress;
    });
  }, []);

  // Update conversation data
  const updateConversationData = useCallback((stepId: string, conversationData: Partial<ConversationData>) => {
    setUserProgress(currentProgress => {
      if (!currentProgress) {
        console.warn('⚠️ Cannot update conversation data: userProgress is null');
        return currentProgress;
      }

      console.log('💬 Updating conversation data:', {
        stepId,
        conversationData,
        timestamp: new Date().toISOString()
      });

      const currentConversationData = currentProgress.steps[stepId]?.conversationData || {};
      console.log('📝 Current conversation data before update:', currentConversationData);
      
      const updatedConversationData = {
        ...currentConversationData,
        ...conversationData
      };

      console.log('✨ Updated conversation data:', updatedConversationData);

      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        steps: {
          ...currentProgress.steps,
          [stepId]: {
            ...currentProgress.steps[stepId],
            conversationData: updatedConversationData,
            lastUpdated: new Date().toISOString()
          }
        }
      };

      progressManager.saveProgress(updatedProgress);
      console.log('💾 Conversation data updated and saved to storage');
      
      return updatedProgress;
    });
  }, []);

  // Start conversation
  const startConversation = useCallback((stepId: string, conversationId: string) => {
    setUserProgress(currentProgress => {
      if (!currentProgress) {
        console.error('❌ Cannot start conversation: userProgress is null');
        return currentProgress;
      }

      console.log('🎙️ Starting conversation:', { stepId, conversationId });
      console.log('📊 Current userProgress state:', currentProgress);
      console.log('📋 Current step data:', currentProgress.steps[stepId]);
      
      // Update both conversation data and step state in a single operation
      const currentConversationData = currentProgress.steps[stepId]?.conversationData || {};
      console.log('📝 Current conversation data:', currentConversationData);
      
      const updatedConversationData = {
        ...currentConversationData,
        conversationId,
        startTime: new Date().toISOString()
      };
      
      console.log('✨ Updated conversation data:', updatedConversationData);

      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        steps: {
          ...currentProgress.steps,
          [stepId]: {
            ...currentProgress.steps[stepId],
            state: 'in_progress' as StepState,
            conversationData: updatedConversationData,
            lastUpdated: new Date().toISOString()
          }
        }
      };

      console.log('🔄 About to update progress with:', updatedProgress);
      progressManager.saveProgress(updatedProgress);
      
      console.log('💬 Updated conversation data and step state:', {
        stepId,
        conversationData: updatedConversationData,
        newState: 'in_progress'
      });
      console.log('💾 Progress saved to storage');
      
      return updatedProgress;
    });
  }, []);

  // End conversation
  const endConversation = useCallback((stepId: string, finalData?: Partial<ConversationData>) => {
    setUserProgress(currentProgress => {
      if (!currentProgress) {
        console.error('❌ Cannot end conversation: userProgress is null');
        return currentProgress;
      }

      console.log('🔇 Ending conversation:', { stepId, finalData });
      console.log('📊 Current userProgress state:', currentProgress);
      console.log('📋 Current step data:', currentProgress.steps[stepId]);
      
      // Update both conversation data and step state in a single operation
      const currentConversationData = currentProgress.steps[stepId]?.conversationData || {};
      console.log('📝 Current conversation data before update:', currentConversationData);
      
      const updatedConversationData = {
        ...currentConversationData,
        ...finalData, // Include any final data passed in (like messages)
        endTime: new Date().toISOString()
      };
      
      console.log('✨ Updated conversation data with endTime:', updatedConversationData);

      const updatedProgress = {
        ...currentProgress,
        lastUpdated: new Date().toISOString(),
        steps: {
          ...currentProgress.steps,
          [stepId]: {
            ...currentProgress.steps[stepId],
            state: 'complete' as StepState,
            conversationData: updatedConversationData,
            lastUpdated: new Date().toISOString()
          }
        }
      };

      console.log('🔄 Ending conversation - updating progress with:', {
        stepId,
        conversationData: updatedConversationData,
        newState: 'complete'
      });

      progressManager.saveProgress(updatedProgress);
      
      console.log('✅ Conversation ended and step marked complete');
      console.log('💾 Final conversation data saved:', updatedProgress.steps[stepId]?.conversationData);
      
      return updatedProgress;
    });
  }, []);

  // Clear progress
  const clearProgress = useCallback(() => {
    setUserProgress(currentProgress => {
      if (!currentProgress) {
        console.warn('⚠️ Cannot clear progress: userProgress is null');
        return currentProgress;
      }
      
      progressManager.clearProgress(currentProgress.workflowId);
      console.log('🗑️ Progress cleared');
      return null;
    });
  }, []);

  // Export progress
  const exportProgress = useCallback(() => {
    return progressManager.exportProgress();
  }, []);

  // Import progress
  const importProgress = useCallback((data: string): boolean => {
    const success = progressManager.importProgress(data);
    if (success) {
      setUserProgress(currentProgress => {
        if (!currentProgress) return currentProgress;
        
        // Reload current progress
        const reloadedProgress = progressManager.loadProgress(currentProgress.workflowId);
        if (reloadedProgress) {
          console.log('📥 Progress imported and reloaded');
          return reloadedProgress;
        }
        return currentProgress;
      });
    }
    return success;
  }, []);

  return {
    userProgress,
    stepStates,
    updateStepState,
    updateConversationData,
    startConversation,
    endConversation,
    clearProgress,
    exportProgress,
    importProgress,
    isLoading
  };
};
