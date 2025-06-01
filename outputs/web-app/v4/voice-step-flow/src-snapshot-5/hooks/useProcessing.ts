import { useEffect } from 'react';
import { processingService } from '../services/processingService';
import { UserProgress } from '../types/userProgress';

interface ConversationUpdateHandlers {
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
  onConversationProgressUpdate?: (stepId: string, progressData: any) => void;
}

/**
 * Hook to manage processing service lifecycle
 * @param enabled Whether the processing service is enabled
 * @param progress The current progress state from React
 * @param handlers Handlers for conversation updates
 */
export const useProcessing = (
  enabled: boolean = true, 
  progress: UserProgress | null = null,
  handlers?: ConversationUpdateHandlers
) => {
  useEffect(() => {
    // Update the progress state in the service whenever it changes
    processingService.updateProgressState(progress);
  }, [progress]);

  useEffect(() => {
    // Update handlers if provided
    if (handlers) {
      processingService.setConversationUpdateHandlers(handlers);
    }
  }, [handlers]);

  useEffect(() => {
    if (enabled) {
      processingService.start();
      
      // Clean up by stopping the service when component unmounts
      return () => {
        processingService.stop();
      };
    }
  }, [enabled]);

  return {
    stop: () => processingService.stop(),
    start: () => processingService.start(),
    isActive: () => processingService.isActive(),
  };
};
