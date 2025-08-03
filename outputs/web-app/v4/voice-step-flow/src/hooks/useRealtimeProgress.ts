import { useEffect, useRef } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
import { UserProgress } from '../types/userProgress';

interface UseRealtimeProgressProps {
  userId?: string;
  workflowId?: string;
  onProgressUpdate?: (progress: any) => void;
  enabled?: boolean;
}

export const useRealtimeProgress = ({
  userId,
  workflowId,
  onProgressUpdate,
  enabled = true
}: UseRealtimeProgressProps) => {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !userId || !workflowId || !isSupabaseAvailable || !supabase) {
      if (!isSupabaseAvailable) {
        console.log('🔌 Offline mode: Skipping real-time progress subscription');
      }
      return;
    }

    console.log('🔄 Setting up real-time progress subscription...', { userId, workflowId });

    // Create a channel for this user's progress updates
    const channel = supabase
      .channel(`user-progress-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all changes (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Real-time progress update received:', payload);
          
          if (onProgressUpdate) {
            onProgressUpdate(payload);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public', 
          table: 'step_progress',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('📡 Real-time step progress update received:', payload);
          
          if (onProgressUpdate) {
            onProgressUpdate(payload);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time progress sync enabled');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Real-time subscription error - continuing without real-time sync');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Real-time subscription closed - continuing without real-time sync');
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up real-time progress subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, workflowId, enabled, onProgressUpdate]);

  return {
    isConnected: channelRef.current?.state === 'joined',
    disconnect: () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }
  };
};
