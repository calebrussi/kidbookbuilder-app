import { supabase } from '../lib/supabase';
import { UserProgress, StepProgress, CapturedData } from '../types/userProgress';

export class SupabaseProgressService {
  
  /**
   * Load user progress from Supabase
   */
  static async loadUserProgress(userId: string, workflowId: string): Promise<UserProgress | null> {
    try {
      console.log('📊 Loading user progress from Supabase...', { userId, workflowId });

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          console.warn('⏰ Supabase progress loading timed out after 5 seconds');
          resolve(null);
        }, 5000);
      });

      // Get main progress record with timeout
      const progressPromise = supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('workflow_id', workflowId)
        .limit(1)
        .maybeSingle();

      const { data: progressData, error: progressError } = await Promise.race([
        progressPromise,
        timeoutPromise
      ]) as any;

      if (progressError) {
        console.error('❌ Error loading user progress from Supabase:', progressError);
        console.error('❌ Error details:', progressError.message);
        return null;
      }

      if (!progressData) {
        console.log('📊 No existing progress found for user in Supabase');
        return null;
      }

      console.log('📊 Found progress data in Supabase:', progressData);

      // Get step progress records
      const { data: stepProgressData, error: stepError } = await supabase
        .from('step_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('workflow_id', workflowId);

      if (stepError) {
        console.error('❌ Error loading step progress:', stepError);
        return null;
      }

      // Convert step progress array to object
      const stepProgress: Record<string, StepProgress> = {};
      stepProgressData?.forEach(step => {
        stepProgress[step.step_id] = {
          stepId: step.step_id,
          status: step.status,
          conversationId: step.conversation_id,
          lastModified: new Date(step.last_modified),
          attemptCount: step.attempt_count || 0,
          messages: step.messages || [],
          success: step.success || false,
          conversationStatus: step.conversation_status || 'not_started'
        };
      });

      // Reconstruct UserProgress object
      const userProgress: UserProgress = {
        workflowId: progressData.workflow_id,
        sessionId: progressData.session_id,
        currentStepId: progressData.current_step_id,
        stepProgress,
        overallProgress: {
          totalSteps: progressData.total_steps,
          completedSteps: progressData.completed_steps,
          percentComplete: progressData.percent_complete
        },
        sessionData: {
          startedAt: new Date(progressData.started_at),
          lastActivityAt: new Date(progressData.last_activity_at),
          timeSpentMinutes: progressData.time_spent_minutes || 0
        }
      };

      console.log('✅ User progress loaded successfully from Supabase');
      return userProgress;

    } catch (error) {
      console.error('❌ Failed to load user progress from Supabase:', error);
      return null;
    }
  }

  /**
   * Save user progress to Supabase
   */
  static async saveUserProgress(userId: string, progress: UserProgress): Promise<boolean> {
    try {
      console.log('💾 Saving user progress to Supabase...', { userId, workflowId: progress.workflowId });

      // Helper function to ensure dates are properly formatted
      const ensureISOString = (dateValue: any): string => {
        if (!dateValue) return new Date().toISOString();
        if (typeof dateValue === 'string') return dateValue;
        if (dateValue instanceof Date) return dateValue.toISOString();
        return new Date(dateValue).toISOString();
      };

      // Upsert main progress record
      const { error: progressError } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          workflow_id: progress.workflowId,
          session_id: progress.sessionId,
          current_step_id: progress.currentStepId,
          total_steps: progress.overallProgress.totalSteps,
          completed_steps: progress.overallProgress.completedSteps,
          percent_complete: progress.overallProgress.percentComplete,
          started_at: ensureISOString(progress.sessionData.startedAt),
          last_activity_at: ensureISOString(progress.sessionData.lastActivityAt),
          time_spent_minutes: progress.sessionData.timeSpentMinutes,
          updated_at: new Date().toISOString()
        });

      if (progressError) {
        console.error('❌ Error saving user progress:', progressError);
        return false;
      }

      // Save step progress records
      for (const [stepId, stepData] of Object.entries(progress.stepProgress)) {
        const { error: stepError } = await supabase
          .from('step_progress')
          .upsert({
            user_id: userId,
            workflow_id: progress.workflowId,
            step_id: stepId,
            status: stepData.status,
            conversation_id: stepData.conversationId,
            last_modified: ensureISOString(stepData.lastModified),
            attempt_count: stepData.attemptCount,
            messages: stepData.messages,
            success: stepData.success,
            conversation_status: stepData.conversationStatus,
            updated_at: new Date().toISOString()
          });

        if (stepError) {
          console.error(`❌ Error saving step progress for ${stepId}:`, stepError);
          return false;
        }
      }

      console.log('✅ User progress saved successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to save user progress:', error);
      return false;
    }
  }

  /**
   * Create new user progress record
   */
  static async createNewProgress(userId: string, workflowId: string, sessionId: string): Promise<UserProgress | null> {
    try {
      console.log('➕ Creating new user progress...', { userId, workflowId, sessionId });

      const now = new Date();
      
      // Create basic progress structure (you'll need to adapt this based on your workflow)
      const newProgress: UserProgress = {
        workflowId,
        sessionId,
        currentStepId: '', // Will be set based on workflow
        stepProgress: {},
        overallProgress: {
          totalSteps: 0,
          completedSteps: 0,
          percentComplete: 0
        },
        sessionData: {
          startedAt: now,
          lastActivityAt: now,
          timeSpentMinutes: 0
        }
      };

      // Save to database
      const saved = await this.saveUserProgress(userId, newProgress);
      
      if (saved) {
        console.log('✅ New user progress created successfully');
        return newProgress;
      } else {
        console.error('❌ Failed to save new user progress');
        return null;
      }

    } catch (error) {
      console.error('❌ Failed to create new user progress:', error);
      return null;
    }
  }
}
