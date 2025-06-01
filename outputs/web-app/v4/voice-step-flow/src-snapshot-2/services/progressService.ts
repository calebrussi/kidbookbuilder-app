import { UserProgress, StepProgress, StepStatus, CapturedData, Message } from '../types/userProgress';
import { storageService } from './storageService';
import { workflowService } from './workflowService';

class ProgressService {
  createNewProgress(sessionId: string, workflowId: string): UserProgress {
    const allSteps = workflowService.getAllSteps();
    const stepProgress: Record<string, StepProgress> = {};

    // Initialize all steps as not_started, except the first one
    allSteps.forEach((item, index) => {
      const stepId = item.step.id;
      stepProgress[stepId] = {
        stepId,
        status: index === 0 ? 'in_progress' : 'not_started',
        conversationId: `conv_${stepId}_${Date.now()}`,
        lastModified: new Date(),
        attemptCount: 0,
        messages: [], // Initialize empty messages array
        success: false, // Initialize success as false rather than undefined
        conversationStatus: 'not_started' // Initialize conversation status
      };
    });

    const progress: UserProgress = {
      workflowId,
      sessionId,
      currentStepId: allSteps[0]?.step.id || '',
      stepProgress,
      overallProgress: {
        totalSteps: allSteps.length,
        completedSteps: 0,
        percentComplete: 0
      },
      sessionData: {
        startedAt: new Date(),
        lastActivityAt: new Date(),
        timeSpentMinutes: 0
      }
    };

    return progress;
  }

  updateStepStatus(progress: UserProgress, stepId: string, status: StepStatus, capturedData?: CapturedData[]): UserProgress {
    const updatedProgress = { ...progress };
    
    if (!updatedProgress.stepProgress[stepId]) return progress;

    // Update the specific step
    updatedProgress.stepProgress[stepId] = {
      ...updatedProgress.stepProgress[stepId],
      status,
      lastModified: new Date(),
      ...(capturedData && { capturedData }),
      ...(status === 'complete' && { completedAt: new Date() }),
      ...(status === 'in_progress' && !updatedProgress.stepProgress[stepId].startedAt && { startedAt: new Date() })
    };

    // If setting to in_progress, set all other steps to not in_progress
    if (status === 'in_progress') {
      Object.keys(updatedProgress.stepProgress).forEach(id => {
        if (id !== stepId && updatedProgress.stepProgress[id].status === 'in_progress') {
          updatedProgress.stepProgress[id].status = 'started';
        }
      });
      updatedProgress.currentStepId = stepId;
    }

    // Update overall progress
    const completedCount = Object.values(updatedProgress.stepProgress).filter(
      sp => sp.status === 'complete'
    ).length;
    
    updatedProgress.overallProgress = {
      ...updatedProgress.overallProgress,
      completedSteps: completedCount,
      percentComplete: (completedCount / updatedProgress.overallProgress.totalSteps) * 100
    };

    // Update session data
    updatedProgress.sessionData.lastActivityAt = new Date();

    return updatedProgress;
  }

  canActivateStep(progress: UserProgress, stepId: string): boolean {
    const allSteps = workflowService.getAllSteps();
    const targetStepIndex = allSteps.findIndex(item => item.step.id === stepId);
    
    if (targetStepIndex === -1) return false;

    // Can always activate the first step
    if (targetStepIndex === 0) return true;

    // Can activate if this step or any previous step has been started
    for (let i = 0; i <= targetStepIndex; i++) {
      const stepStatus = progress.stepProgress[allSteps[i].step.id]?.status;
      if (stepStatus === 'started' || stepStatus === 'complete' || stepStatus === 'in_progress') {
        return true;
      }
    }

    return false;
  }

  getNextStep(progress: UserProgress): string | null {
    const allSteps = workflowService.getAllSteps();
    const currentStepIndex = allSteps.findIndex(item => item.step.id === progress.currentStepId);
    
    if (currentStepIndex === -1 || currentStepIndex >= allSteps.length - 1) return null;
    
    return allSteps[currentStepIndex + 1].step.id;
  }

  updateStepConversationId(progress: UserProgress, stepId: string, conversationId: string): UserProgress {
    const updatedProgress = { ...progress };
    
    if (!updatedProgress.stepProgress[stepId]) return progress;

    // Update the conversation ID for the specific step
    updatedProgress.stepProgress[stepId] = {
      ...updatedProgress.stepProgress[stepId],
      conversationId,
      lastModified: new Date(),
    };

    // Update session data
    updatedProgress.sessionData.lastActivityAt = new Date();

    return updatedProgress;
  }

  addMessage(progress: UserProgress, stepId: string, message: Omit<Message, 'id' | 'timestamp'>): UserProgress {
    const updatedProgress = { ...progress };

    if (!updatedProgress.stepProgress[stepId]) return progress;

    const newMessage: Message = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date()
    };

    // Add the message to the step's messages array
    updatedProgress.stepProgress[stepId] = {
      ...updatedProgress.stepProgress[stepId],
      messages: [
        ...(updatedProgress.stepProgress[stepId].messages || []),
        newMessage
      ],
      lastModified: new Date()
    };

    // Update session data
    updatedProgress.sessionData.lastActivityAt = new Date();

    return updatedProgress;
  }

  updateStepConversationProgress(
    progress: UserProgress,
    stepId: string,
    progressData: {
      stepStatus?: StepStatus;
      analysis?: any[];
      success?: boolean;
      conversationStatus?: string;
    }
  ): UserProgress {
    const updatedProgress = { ...progress };

    if (!updatedProgress.stepProgress[stepId]) return progress;

    // Update the progress data for the specific step
    updatedProgress.stepProgress[stepId] = {
      ...updatedProgress.stepProgress[stepId],
      // status: progressData.stepStatus || updatedProgress.stepProgress[stepId].status,
      analysis: progressData.analysis || updatedProgress.stepProgress[stepId].analysis,
      success: progressData.success !== undefined ? progressData.success : updatedProgress.stepProgress[stepId].success,
      conversationStatus: progressData.conversationStatus || updatedProgress.stepProgress[stepId].conversationStatus,
      lastModified: new Date()
    };

    // If the conversation was successful, mark the step as complete
    if (progressData.success === true && updatedProgress.stepProgress[stepId].status !== 'complete') {
      console.log(`Marking step ${stepId} as complete`);
      // Create a new reference for stepProgress[stepId] to ensure React detects the state change
      updatedProgress.stepProgress = {
        ...updatedProgress.stepProgress,
        [stepId]: {
          ...updatedProgress.stepProgress[stepId],
          status: 'complete',
          completedAt: new Date()
        }
      };

      // Update overall progress counters
      const completedCount = Object.values(updatedProgress.stepProgress).filter(
        sp => sp.status === 'complete'
      ).length;

      updatedProgress.overallProgress = {
        ...updatedProgress.overallProgress,
        completedSteps: completedCount,
        percentComplete: (completedCount / updatedProgress.overallProgress.totalSteps) * 100
      };
    }

    // Update session data
    updatedProgress.sessionData.lastActivityAt = new Date();

    return updatedProgress;
  }
}

export const progressService = new ProgressService();
