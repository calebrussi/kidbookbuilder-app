import { UserProgress, StepProgress, StepStatus } from '../types/userProgress';
import { progressService } from './progressService';

// Interface for the conversation update handlers
interface ConversationUpdateHandlers {
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
  onConversationProgressUpdate?: (stepId: string, progressData: any) => void;
}

/**
 * A service that handles periodic processing tasks
 */
class ProcessingService {
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs = 10000; // 10 seconds
  private isRunning = false;
  private currentProgress: UserProgress | null = null;
  private conversationUpdateHandlers: ConversationUpdateHandlers | null = null;
  
  /**
   * Updates the current progress reference
   * This allows the service to access the latest React state
   */
  updateProgressState(progress: UserProgress | null): void {
    this.currentProgress = progress;
  }

  /**
   * Sets the handlers for conversation updates
   * @param handlers The handlers for processing conversation updates
   */
  setConversationUpdateHandlers(handlers: ConversationUpdateHandlers): void {
    this.conversationUpdateHandlers = handlers;
  }

  /**
   * Processes data at regular intervals
   * This method contains the core business logic that runs on each interval
   */
  private async process(): Promise<void> {
    try {
    //   console.log('Processing cycle executed at:', new Date().toISOString());
      
      // Use the progress from React state
      const progress = this.currentProgress;
      if (!progress) {
        console.log('No progress data available in React state');
        return;
      }
      
      // Find steps with 'processing' conversation status
      const processingSteps = this.findProcessingSteps(progress);
    //   console.log('Processing steps:', processingSteps);
      
      if (processingSteps.length > 0) {
        console.log(`Found ${processingSteps.length} steps with processing status:`, 
          processingSteps.map(step => step.stepId));
        
        // Process each step with 'processing' status
        for (const step of processingSteps) {
          if (step.conversationId) {
            console.log(`Checking conversation status for step ${step.stepId}, conversation ID: ${step.conversationId}`);
            
            // Fetch and update the conversation data
            const updatedProgress = await this.fetchConversationAndUpdateProgress(
              step.conversationId,
              progress,
              this.conversationUpdateHandlers || undefined
            );
            
            if (updatedProgress) {
              this.currentProgress = updatedProgress;
              console.log(`Updated progress for step ${step.stepId}`);
            }
          }
        }
      } else {
        // console.log('No steps with processing status found');
      }
    } catch (error) {
      console.error('Error in processing cycle:', error);
    }
  }
  
  /**
   * Finds all steps with a conversationStatus of 'processing'
   * @param progress The user's progress data
   * @returns Array of step progress items that are in processing state
   */
  private findProcessingSteps(progress: UserProgress): StepProgress[] {
    const { stepProgress } = progress;
    
    return Object.values(stepProgress).filter(step => 
      step.conversationStatus === 'processing' || step.conversationStatus === 'in-progress'
    );
  }

  /**
   * Fetch conversation data from the API and update the progress
   * @param conversationId The ID of the conversation to fetch
   * @param progress The current user progress 
   * @param handlers Optional callbacks to handle updates
   * @returns A promise that resolves to the updated progress or null if failed
   */
  async fetchConversationAndUpdateProgress(
    conversationId: string, 
    progress: UserProgress,
    handlers?: ConversationUpdateHandlers
  ): Promise<UserProgress | null> {
    try {
      console.log("Fetching conversation data for ID:", conversationId);
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
      const response = await fetch(`${apiBaseUrl}/api/conversation/${conversationId}`);
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const resp = await response.json();
      console.log("API response for conversation:", resp);

      const analysis = resp.data.analysis || [];
      const success = resp.data.analysis?.call_successful === "success" || false;
      const conversationStatus = resp.data.status;
    //   const stepStatus:StepStatus = resp.data.analysis?.call_successful || progress.stepProgress[progress.currentStepId].status;

      console.log(
        "Current StepStatus:" + progress.stepProgress[progress.currentStepId].status,
        // "New StepStatus:" + stepStatus,
        "Analysis:", analysis,
        "Success:", success,
        "ConversationStatus:", conversationStatus
      );

      // Delegate state mutation to progressService
      const updatedProgress = progressService.updateStepConversationProgress(
        progress,
        progress.currentStepId,
        { analysis: resp.data.analysis, success, conversationStatus }
      );

       console.log("Updated progress after conversation fetch:", updatedProgress);

       // If we have access to update handlers, call them
      if (handlers?.onConversationIdUpdate) {
        handlers.onConversationIdUpdate(
          updatedProgress.currentStepId,
          updatedProgress.stepProgress[updatedProgress.currentStepId].conversationId
        );
      }

       // If we have a conversation progress update handler, use it
       if (handlers?.onConversationProgressUpdate) {
         console.log("Calling onConversationProgressUpdate with:", {
           stepId: updatedProgress.currentStepId,
          progressData: { analysis: resp.data.analysis, success, conversationStatus },
         });
         handlers.onConversationProgressUpdate(
           updatedProgress.currentStepId, 
          { analysis: resp.data.analysis, success, conversationStatus }
         );
       }
       
      return updatedProgress;
    } catch (error) {
      console.error("Error fetching conversation data:", error);
      return null;
    }
  }

  /**
   * Start the processing service
   */
  start(): void {
    if (this.intervalId) {
      this.stop();
    }
    
    // Execute the process immediately once
    void this.process();
    
    // Set up interval for periodic execution
    this.intervalId = setInterval(() => {
      void this.process();
    }, this.intervalMs);
    
    this.isRunning = true;
    console.log('Processing service started');
  }

  /**
   * Stop the processing service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('Processing service stopped');
    }
  }
  
  /**
   * Check if the service is currently running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

export const processingService = new ProcessingService();
