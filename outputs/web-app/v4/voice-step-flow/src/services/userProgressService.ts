import { supabase } from '../lib/supabase';

export interface UserProgress {
  id?: string;
  user_id: string;
  workflow_id: string;
  current_step_id: string | null;
  completed_steps: string[];
  step_data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface StepProgress {
  id?: string;
  user_id: string;
  step_id: string;
  conversation_id?: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  conversation_progress?: any;
  captured_data?: any;
  created_at?: string;
  updated_at?: string;
}

export class UserProgressService {
  // Get user's workflow progress
  static async getUserProgress(workflowId: string): Promise<UserProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('workflow_id', workflowId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  // Create or update user's workflow progress
  static async upsertUserProgress(progress: Partial<UserProgress>): Promise<UserProgress> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const progressData = {
      user_id: user.id,
      ...progress,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('user_progress')
      .upsert(progressData, { 
        onConflict: 'user_id,workflow_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Get user's step progress
  static async getStepProgress(stepId: string): Promise<StepProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('step_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('step_id', stepId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  // Create or update step progress
  static async upsertStepProgress(stepProgress: Partial<StepProgress>): Promise<StepProgress> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const stepData = {
      user_id: user.id,
      ...stepProgress,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('step_progress')
      .upsert(stepData, { 
        onConflict: 'user_id,step_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // Get all step progress for user
  static async getAllStepProgress(): Promise<StepProgress[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { data, error } = await supabase
      .from('step_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  }

  // Reset user's progress for a workflow
  static async resetUserProgress(workflowId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Delete user progress
    const { error: progressError } = await supabase
      .from('user_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('workflow_id', workflowId);

    if (progressError) {
      throw progressError;
    }

    // Delete all step progress for this user
    const { error: stepError } = await supabase
      .from('step_progress')
      .delete()
      .eq('user_id', user.id);

    if (stepError) {
      throw stepError;
    }
  }
}
