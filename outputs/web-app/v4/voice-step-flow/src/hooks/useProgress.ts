import { useState, useEffect, useCallback } from 'react';
import { UserProgress, StepStatus, CapturedData } from '../types/userProgress';
import { Workflow } from '../types/workflow';
import { storageService } from '../services/storageService';
import { progressService } from '../services/progressService';
import { SupabaseProgressService } from '../services/supabaseProgressService';
import { useRealtimeProgress } from './useRealtimeProgress';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export const useProgress = (workflow?: Workflow | null, workflowLoading?: boolean) => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Set up real-time subscriptions for progress updates
  const { isConnected } = useRealtimeProgress({
    userId: user?.id,
    workflowId: workflow?.id || 'character-creation-quiz',
    onProgressUpdate: (payload) => {
      console.log('📡 Real-time progress update received in hook:', payload);
      // TODO: Update local progress state when real-time updates come in
      // This will sync progress across multiple browser tabs/devices
    },
    enabled: !!user && !!workflow
  });

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

        // For now, skip Supabase and use localStorage until database tables are created
        console.log('� Using localStorage system (Supabase tables not yet created)...');
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

        // TODO: Migrate to Supabase once database tables are created
        // if (user?.id) {
        //   console.log('�️ Attempting to load progress from Supabase...');
        //   try {
        //     userProgress = await SupabaseProgressService.loadUserProgress(
        //       user.id, 
        //       workflow.id || 'character-creation-quiz'
        //     );
        //     console.log('📊 Supabase progress result:', userProgress);
        //   } catch (error) {
        //     console.warn('⚠️ Supabase progress loading failed, falling back to localStorage:', error);
        //     userProgress = null;
        //   }
        // }

        console.log('🎯 Setting progress state...');
        setProgress(userProgress);
        console.log('✅ Progress initialization complete!');
        console.log('📡 Real-time connection:', isConnected ? 'Connected' : 'Disconnected');
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
  }, [user?.id]); // Add user?.id as dependency

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
    [user?.id] // Add user?.id as dependency
  );

  const updateStepConversationProgress = useCallback(
    (
      stepId: string,
      progressData: { stepStatus?: StepStatus, analysis?: any; success?: boolean; conversationStatus?: string }
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
