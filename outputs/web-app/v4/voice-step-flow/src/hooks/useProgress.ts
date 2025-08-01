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
        let supabaseAttempted = false;

        // Try to load from Supabase first if user is authenticated
        if (user?.id) {
          console.log('🗄️ Attempting to load progress from localStorage first...');
    
    // Try localStorage first for faster loading - use user-specific key
    try {
      const userSpecificKey = `character-quiz-app-${user.id}`;
      const storageData = localStorage.getItem(userSpecificKey);
      if (storageData) {
        const parsed = JSON.parse(storageData);
        const userProgressData = parsed.userProgress;
        if (userProgressData && Object.keys(userProgressData).length > 0) {
          // Get the most recent progress for this workflow
          const workflowProgressArray = Object.values(userProgressData).filter((p: any) => 
            p.workflowId === workflow.id
          );
          
          if (workflowProgressArray.length > 0) {
            // Sort by last activity and get the most recent
            const mostRecentProgress = workflowProgressArray.sort((a: any, b: any) => 
              new Date(b.sessionData?.lastActivityAt || 0).getTime() - 
              new Date(a.sessionData?.lastActivityAt || 0).getTime()
            )[0] as UserProgress;
            
            console.log('📱 Found user-specific progress in localStorage:', mostRecentProgress);
            setProgress(mostRecentProgress);
            
            // Save to Supabase in background (don't wait)
            SupabaseProgressService.saveUserProgress(user.id, mostRecentProgress).catch(error => {
              console.log('⚠️ Background Supabase save failed, but localStorage working:', error);
            });
            
            console.log('✅ Progress loaded from user-specific localStorage successfully');
            return;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Error parsing user-specific localStorage data, trying Supabase...');
    }
    
    console.log('🗄️ No user-specific localStorage data found, attempting to load from Supabase...');
    
    // Check for non-user-specific localStorage (from before user-specific keys)
    try {
      const oldStorageData = localStorage.getItem('character-quiz-app');
      if (oldStorageData) {
        const parsed = JSON.parse(oldStorageData);
        const userProgressData = parsed.userProgress;
        console.log('🔍 DEBUG: Full old localStorage data:', parsed);
        console.log('🔍 DEBUG: User progress data keys:', Object.keys(userProgressData || {}));
        
        if (userProgressData && Object.keys(userProgressData).length > 0) {
          // Log all sessions for debugging
          Object.entries(userProgressData).forEach(([sessionId, progress]: [string, any]) => {
            console.log(`🔍 DEBUG: Session ${sessionId}:`, {
              workflowId: progress.workflowId,
              currentStepId: progress.currentStepId,
              lastActivity: progress.sessionData?.lastActivityAt,
              stepStatuses: Object.fromEntries(
                Object.entries(progress.stepProgress || {}).map(([stepId, step]: [string, any]) => [
                  stepId, 
                  { status: step.status, messagesCount: step.messages?.length || 0 }
                ])
              )
            });
          });
          
          const workflowProgressArray = Object.values(userProgressData).filter((p: any) => 
            p.workflowId === workflow.id
          );
          
          if (workflowProgressArray.length > 0) {
            const mostRecentProgress = workflowProgressArray.sort((a: any, b: any) => 
              new Date(b.sessionData?.lastActivityAt || 0).getTime() - 
              new Date(a.sessionData?.lastActivityAt || 0).getTime()
            )[0] as UserProgress;
            
            console.log('📱 Found recent progress in old localStorage format, migrating to user-specific...');
            console.log('🔍 DEBUG: Migrating progress:', mostRecentProgress);
            console.log('🔍 DEBUG: Step progress details:', mostRecentProgress.stepProgress);
            
            setProgress(mostRecentProgress);
            
            // Save to user-specific localStorage
            storageService.saveUserProgress(mostRecentProgress, user.id);
            
            // Save to Supabase
            SupabaseProgressService.saveUserProgress(user.id, mostRecentProgress).catch(error => {
              console.log('⚠️ Background Supabase save failed during migration:', error);
            });
            
            console.log('✅ Progress migrated from old localStorage format');
            return;
          }
        }
      }
    } catch (error) {
      console.log('⚠️ Error checking old localStorage format:', error);
    }
          try {
            // Use user ID as the key (reverting email-based approach due to DB schema)
            const userKey = user.id;
            userProgress = await SupabaseProgressService.loadUserProgress(
              userKey, 
              workflow.id || 'character-creation-quiz'
            );
            supabaseAttempted = true;
            console.log('📊 Supabase progress result:', userProgress);
            
            // If Supabase connected successfully but no progress found, create new
            if (!userProgress) {
              console.log('📊 No progress found in Supabase, creating new progress...');
              const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              userProgress = progressService.createNewProgress(sessionId, workflow.id);
              console.log('✅ New progress created:', userProgress);
            }
          } catch (error) {
            console.warn('⚠️ Supabase progress loading failed, falling back to localStorage:', error);
            userProgress = null;
            supabaseAttempted = false;
          }
        }

        // Fallback to localStorage system ONLY if Supabase wasn't attempted or failed
        if (!userProgress && !supabaseAttempted) {
          console.log('📁 Falling back to localStorage system...');
          const session = storageService.getCurrentSession();
          console.log('📅 Current session:', session);
          
          userProgress = storageService.getUserProgress(session.sessionId);
          console.log('📊 Existing progress from localStorage:', userProgress);

          // Check if progress is corrupted (empty currentStepId)
          if (userProgress && !userProgress.currentStepId) {
            console.warn('🚨 Corrupted progress detected (empty currentStepId), clearing and creating fresh...');
            userProgress = null;
            storageService.clearAllData();
          }

          if (!userProgress) {
            console.log('➕ Creating new progress...');
            userProgress = progressService.createNewProgress(session.sessionId, session.workflowId);
            storageService.saveUserProgress(userProgress);
            console.log('✅ New progress created:', userProgress);
          }
        }

        // Save to Supabase if user is authenticated and we have progress
        if (user?.id && userProgress) {
          console.log('� Ensuring progress is saved to Supabase...');
          try {
            // Use user ID for consistency
            const userKey = user.id;
            // Don't await this - run in background to avoid blocking UI
            SupabaseProgressService.saveUserProgress(userKey, userProgress)
              .then(syncSuccess => {
                if (syncSuccess) {
                  console.log('✅ Progress synced to Supabase successfully');
                } else {
                  console.warn('⚠️ Failed to sync progress to Supabase');
                }
              })
              .catch(error => {
                console.warn('⚠️ Error syncing progress to Supabase:', error);
              });
          } catch (error) {
            console.warn('⚠️ Error starting Supabase sync:', error);
          }
        }

        console.log('🎯 Setting progress state...');
        
        // Ensure proper step structure exists for current workflow
        if (userProgress && workflow) {
          userProgress = progressService.ensureStepStructure(userProgress, workflow);
          console.log('🔧 Ensured step structure for loaded progress');
        }
        
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
      storageService.saveUserProgress(updatedProgress, user?.id);
      
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

  const resetProgress = useCallback(async () => {
    console.log('🔄 Resetting all progress data...');
    
    if (!workflow || !user?.id) {
      console.warn('⚠️ Cannot reset progress: missing workflow or user');
      return;
    }
    
    // Create fresh progress
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProgress = progressService.createNewProgress(sessionId, workflow.id);
    
    // Update React state immediately
    setProgress(newProgress);
    
    // Clear user-specific localStorage
    const userSpecificKey = `character-quiz-app-${user.id}`;
    localStorage.removeItem(userSpecificKey);
    
    // Clear old localStorage format too
    localStorage.removeItem('character-quiz-app');
    
    // Save the fresh progress to localStorage
    storageService.saveUserProgress(newProgress, user.id);
    
    // Clear Supabase progress
    try {
      await SupabaseProgressService.saveUserProgress(user.id, newProgress);
      console.log('✅ Progress reset successfully in all storage systems');
    } catch (error) {
      console.error('❌ Error clearing Supabase progress:', error);
    }
  }, [workflow, user?.id]);

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
        storageService.saveUserProgress(updatedProgress, user?.id);
        
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
