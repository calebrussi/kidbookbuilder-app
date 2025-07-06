import { useState, useEffect, useCallback } from 'react';
import { UserProgress, StepStatus, CapturedData, Message, Analysis } from '../types/userProgress';
import { Workflow } from '../types/workflow';
import { storageService } from '../services/storageService';
import { progressService } from '../services/progressService';
import { SupabaseProgressService } from '../services/supabaseProgressService';
import { useRealtimeProgress } from './useRealtimeProgress';
import { useAuth } from '../context/AuthContext';

export const useProgress = (workflow?: Workflow | null, workflowLoading?: boolean) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set up real-time subscriptions for progress updates (temporarily disabled for debugging)
  const isConnected = false; // Temporarily disable real-time
  
  /*
  const { isConnected } = useRealtimeProgress({
    userId: user?.id,
    workflowId: workflow?.id || 'character-creation-quiz',
    onProgressUpdate: (payload) => {
      console.log('📡 Real-time progress update received:', payload);
    },
    enabled: !!user && !!workflow
  });
  */

  useEffect(() => {
    // Don't initialize progress until workflow is loaded
    if (workflowLoading || !workflow) {
      return;
    }

    const initializeProgress = async () => {
      try {
        console.log('🔄 Starting progress initialization...');
        console.log('📋 Workflow:', workflow);
        console.log('👤 User:', user?.id);
        
        let userProgress: UserProgress | null = null;

        // Try to load from Supabase first if user is authenticated
        if (user?.id) {
          console.log('🗄️ Attempting to load progress from Supabase...');
          try {
            userProgress = await SupabaseProgressService.loadUserProgress(
              user.id, 
              workflow.id || 'character-creation-quiz'
            );
            console.log('📊 Supabase progress result:', userProgress);
          } catch (error) {
            console.warn('⚠️ Supabase progress loading failed, falling back to localStorage:', error);
            userProgress = null;
          }
        }

        // Fallback to localStorage system if Supabase fails or no user
        if (!userProgress) {
          console.log('📁 Falling back to localStorage system...');
          const session = storageService.getCurrentSession();
          console.log('📅 Current session:', session);
          
          userProgress = storageService.getUserProgress(session.sessionId);
          console.log('📊 Existing progress from localStorage:', userProgress);

          if (!userProgress) {
            console.log('➕ Creating new progress...');
            userProgress = progressService.createNewProgress(session.sessionId, session.workflowId);
            storageService.saveUserProgress(userProgress);
            console.log('✅ New progress created:', userProgress);
          }

          // If user is authenticated, migrate localStorage data to Supabase
          if (user?.id && userProgress) {
            console.log('🔄 Migrating localStorage progress to Supabase...');
            try {
              // Don't await this - run in background to avoid blocking UI
              SupabaseProgressService.saveUserProgress(user.id, userProgress)
                .then(migrationSuccess => {
                  if (migrationSuccess) {
                    console.log('✅ Progress migrated to Supabase successfully');
                  } else {
                    console.warn('⚠️ Failed to migrate progress to Supabase');
                  }
                })
                .catch(error => {
                  console.warn('⚠️ Error migrating progress to Supabase:', error);
                });
            } catch (error) {
              console.warn('⚠️ Error starting Supabase migration:', error);
            }
          }
        }

        console.log('🎯 Setting progress state...');
        setProgress(userProgress);
        console.log('✅ Progress initialization complete!');
      } catch (error) {
        console.error('❌ Failed to initialize progress:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeProgress();
  }, [workflow, workflowLoading, user?.id, isConnected]);

  const updateStepStatus = useCallback(async (stepId: string, status: StepStatus, capturedData?: CapturedData[]) => {
    setProgress(prevProgress => {
      if (!prevProgress) return null;
      const updatedProgress = progressService.updateStepStatus(prevProgress, stepId, status, capturedData);
      
      // Save to localStorage for immediate feedback
      storageService.saveUserProgress(updatedProgress);
      
      // Save to Supabase if user is authenticated (async, don't block UI)
      if (user?.id) {
        SupabaseProgressService.saveUserProgress(user.id, updatedProgress)
          .then(success => {
            if (success) {
              console.log('✅ Progress synced to Supabase');
            } else {
              console.warn('⚠️ Failed to sync progress to Supabase');
            }
          })
          .catch(error => {
            console.error('❌ Error syncing progress to Supabase:', error);
          });
      }
      
      return updatedProgress;
    });
  }, [user?.id]); // progressService and storageService are stable

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
    async (stepId: string, conversationId: string) => {
      setProgress(prevProgress => {
        if (!prevProgress) return null;
        const updatedProgress = progressService.updateStepConversationId(
          prevProgress,
          stepId,
          conversationId
        );
        
        // Save to localStorage immediately
        storageService.saveUserProgress(updatedProgress);
        
        // Save to Supabase if user is authenticated
        if (user?.id) {
          SupabaseProgressService.saveUserProgress(user.id, updatedProgress)
            .catch(error => console.error('❌ Error syncing conversation ID to Supabase:', error));
        }
        
        return updatedProgress;
      });
    },
    [user?.id]
  );

  const updateStepConversationProgress = useCallback(
    (
      stepId: string,
      progressData: { 
        stepStatus?: StepStatus; 
        analysis?: Analysis; 
        success?: boolean; 
        conversationStatus?: string;
        messages?: Message[]; // Add messages support
      }
    ) => {
      setProgress(prevProgress => {
        if (!prevProgress) return null;

        console.log('🔄 Updating step conversation progress:', { stepId, progressData });

        const updatedProgress = progressService.updateStepConversationProgress(
          prevProgress,
          stepId,
          progressData
        );
        
        storageService.saveUserProgress(updatedProgress);
        
        console.log("Updated Progress (inside hook):", updatedProgress);
        console.log("Messages after update:", updatedProgress.stepProgress[stepId]?.messages);

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
