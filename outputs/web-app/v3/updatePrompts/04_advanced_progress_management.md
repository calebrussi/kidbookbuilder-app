# Advanced Progress Management Implementation

## Overview

This document outlines the enhancement of the progress management system to support more robust state tracking, persistence, and user interactions. The improved system will handle detailed progress tracking, message persistence, and captured data management.

## Objective

Enhance the progress management to:

- Track detailed step progress with message history
- Enable update of progress from any component
- Support capturing and displaying user data
- Provide more reliable localStorage persistence
- Support advanced progress state transitions

## Implementation Steps

### 1. Enhance useProgress Hook

Update the useProgress hook to support more advanced operations:

```typescript
// In src/hooks/useProgress.ts
import { useState, useEffect, useCallback } from "react";
import {
  UserProgress,
  StepStatus,
  CapturedData,
  Message,
} from "../types/userProgress";
import { storageService } from "../services/storageService";
import { progressService } from "../services/progressService";

export const useProgress = () => {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize progress from storage or create new progress
  useEffect(() => {
    const initializeProgress = () => {
      try {
        const session = storageService.getCurrentSession();
        let userProgress = storageService.getUserProgress(session.sessionId);

        if (!userProgress) {
          userProgress = progressService.createNewProgress(
            session.sessionId,
            session.workflowId
          );
          storageService.saveUserProgress(userProgress);
        }

        setProgress(userProgress);
      } catch (error) {
        console.error("Failed to initialize progress:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeProgress();
  }, []);

  // Update step status with optional captured data
  const updateStepStatus = useCallback(
    (stepId: string, status: StepStatus, capturedData?: CapturedData[]) => {
      if (!progress) return;

      const updatedProgress = progressService.updateStepStatus(
        progress,
        stepId,
        status,
        capturedData
      );
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);
    },
    [progress]
  );

  // Activate a step for the user to work on
  const activateStep = useCallback(
    (stepId: string) => {
      if (!progress) return;

      // Don't allow activating the same step that's already active
      if (progress.currentStepId === stepId) return;

      // Set the current step to 'started' if it was in progress
      if (progress.currentStepId) {
        const currentStepProgress =
          progress.stepProgress[progress.currentStepId];
        if (
          currentStepProgress &&
          currentStepProgress.status === "in_progress"
        ) {
          updateStepStatus(progress.currentStepId, "started");
        }
      }

      // Set the new step to 'in_progress'
      const updatedProgress = progressService.activateStep(progress, stepId);
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);
    },
    [progress, updateStepStatus]
  );

  // Complete the current step
  const completeCurrentStep = useCallback(
    (capturedData?: CapturedData[]) => {
      if (!progress || !progress.currentStepId) return;

      updateStepStatus(progress.currentStepId, "complete", capturedData);

      // Find and activate the next step if available
      const nextStepId = progressService.findNextStepId(progress);
      if (nextStepId) {
        activateStep(nextStepId);
      }
    },
    [progress, updateStepStatus, activateStep]
  );

  // Check if a step can be activated based on progress rules
  const canActivateStep = useCallback(
    (stepId: string): boolean => {
      if (!progress) return false;

      return progressService.canActivateStep(progress, stepId);
    },
    [progress]
  );

  // Reset all progress to starting state
  const resetProgress = useCallback(() => {
    if (!progress) return;

    const resetUserProgress = progressService.createNewProgress(
      progress.sessionId,
      progress.workflowId
    );

    setProgress(resetUserProgress);
    storageService.saveUserProgress(resetUserProgress);
  }, [progress]);

  // Add the direct progress update function
  const updateProgress = useCallback((updatedProgress: UserProgress) => {
    setProgress(updatedProgress);
    storageService.saveUserProgress(updatedProgress);
  }, []);

  // Add function to update messages for a step
  const updateStepMessages = useCallback(
    (stepId: string, messages: Message[]) => {
      if (!progress) return;

      const updatedProgress = progressService.updateStepMessages(
        progress,
        stepId,
        messages
      );
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);
    },
    [progress]
  );

  // Add function to add a message to the current step
  const addMessage = useCallback(
    (message: Message) => {
      if (!progress || !progress.currentStepId) return;

      const updatedProgress = progressService.addMessage(
        progress,
        progress.currentStepId,
        message
      );
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);

      return updatedProgress;
    },
    [progress]
  );

  // Add captured data to the current step
  const addCapturedData = useCallback(
    (data: CapturedData[]) => {
      if (!progress || !progress.currentStepId) return;

      const updatedProgress = progressService.addCapturedData(
        progress,
        progress.currentStepId,
        data
      );
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);

      return updatedProgress;
    },
    [progress]
  );

  return {
    progress,
    loading,
    activateStep,
    updateStepStatus,
    completeCurrentStep,
    canActivateStep,
    resetProgress,
    updateProgress, // New function
    updateStepMessages, // New function
    addMessage, // New function
    addCapturedData, // New function
  };
};
```

### 2. Enhance ProgressService

Update the progressService to handle advanced progress management:

```typescript
// In src/services/progressService.ts
import { v4 as uuidv4 } from "uuid";
import {
  UserProgress,
  StepStatus,
  StepProgress,
  CapturedData,
  Message,
} from "../types/userProgress";
import { workflowService } from "./workflowService";

export const progressService = {
  // Create new progress object
  createNewProgress: (sessionId: string, workflowId: string): UserProgress => {
    const workflow = workflowService.getWorkflow();

    if (!workflow) {
      throw new Error("Cannot create progress: workflow not loaded");
    }

    // Get all steps across all sections
    const allSteps = workflow.sections.flatMap((section) => section.steps);

    // Generate initial step progress for all steps
    const stepProgress: Record<string, StepProgress> = {};
    allSteps.forEach((step) => {
      stepProgress[step.id] = {
        stepId: step.id,
        status: "not_started",
        conversationId: uuidv4(),
        lastModified: new Date(),
        attemptCount: 0,
      };
    });

    // Find first step
    const firstSection = workflow.sections.find(
      (section) => section.order === 1
    );
    const firstStep = firstSection?.steps.find((step) => step.order === 1);

    if (!firstStep) {
      throw new Error("Cannot determine first step in workflow");
    }

    // Set first step as in_progress
    stepProgress[firstStep.id].status = "in_progress";
    stepProgress[firstStep.id].startedAt = new Date();

    return {
      sessionId,
      workflowId,
      currentStepId: firstStep.id,
      stepProgress,
      overallProgress: {
        totalSteps: allSteps.length,
        completedSteps: 0,
        percentComplete: 0,
      },
      sessionData: {
        startedAt: new Date(),
        lastActivityAt: new Date(),
        timeSpentMinutes: 0,
      },
    };
  },

  // Update status of a specific step
  updateStepStatus: (
    progress: UserProgress,
    stepId: string,
    status: StepStatus,
    capturedData?: CapturedData[]
  ): UserProgress => {
    // Get existing step progress
    const existingStepProgress = progress.stepProgress[stepId];

    if (!existingStepProgress) {
      console.error(`Cannot update step status: step ${stepId} not found`);
      return progress;
    }

    // Create updated step progress
    let updatedStepProgress: StepProgress = {
      ...existingStepProgress,
      status,
      lastModified: new Date(),
    };

    // Handle specific status transitions
    if (status === "in_progress") {
      updatedStepProgress.attemptCount += 1;
      if (!updatedStepProgress.startedAt) {
        updatedStepProgress.startedAt = new Date();
      }
    }

    if (status === "complete") {
      updatedStepProgress.completedAt = new Date();

      // Add captured data if provided
      if (capturedData && capturedData.length > 0) {
        updatedStepProgress.capturedData = [
          ...(existingStepProgress.capturedData || []),
          ...capturedData,
        ];
      }
    }

    // Create new progress object with updated step
    const newProgress = {
      ...progress,
      stepProgress: {
        ...progress.stepProgress,
        [stepId]: updatedStepProgress,
      },
      sessionData: {
        ...progress.sessionData,
        lastActivityAt: new Date(),
      },
    };

    // Update overall progress stats
    return updateOverallProgress(newProgress);
  },

  // Activate a specific step
  activateStep: (progress: UserProgress, stepId: string): UserProgress => {
    // First, check if we can activate this step
    if (!progressService.canActivateStep(progress, stepId)) {
      console.error(
        `Cannot activate step ${stepId}: not allowed by progress rules`
      );
      return progress;
    }

    // If current step is in_progress, change it to started
    let updatedProgress = { ...progress };
    if (progress.currentStepId && progress.currentStepId !== stepId) {
      const currentStepProgress = progress.stepProgress[progress.currentStepId];
      if (currentStepProgress && currentStepProgress.status === "in_progress") {
        updatedProgress = progressService.updateStepStatus(
          updatedProgress,
          progress.currentStepId,
          "started"
        );
      }
    }

    // Set the new step as current and in_progress
    updatedProgress = {
      ...updatedProgress,
      currentStepId: stepId,
    };

    // Only update to in_progress if not already complete
    const stepProgress = updatedProgress.stepProgress[stepId];
    if (stepProgress.status !== "complete") {
      updatedProgress = progressService.updateStepStatus(
        updatedProgress,
        stepId,
        "in_progress"
      );
    }

    return updatedProgress;
  },

  // Check if a step can be activated based on progress rules
  canActivateStep: (progress: UserProgress, stepId: string): boolean => {
    const workflow = workflowService.getWorkflow();
    if (!workflow) return false;

    // Get all steps in order
    const allStepsInOrder = workflow.sections
      .flatMap((section) => section.steps)
      .sort((a, b) => a.order - b.order);

    // Find target step
    const targetStep = allStepsInOrder.find((step) => step.id === stepId);
    if (!targetStep) return false;

    // Find index of target step
    const targetIndex = allStepsInOrder.findIndex((step) => step.id === stepId);
    if (targetIndex === -1) return false;

    // Always allow current step or completed steps
    if (stepId === progress.currentStepId) return true;
    if (progress.stepProgress[stepId]?.status === "complete") return true;
    if (progress.stepProgress[stepId]?.status === "started") return true;

    // Check if all previous steps are complete
    for (let i = 0; i < targetIndex; i++) {
      const prevStep = allStepsInOrder[i];
      if (progress.stepProgress[prevStep.id]?.status !== "complete") {
        return false;
      }
    }

    return true;
  },

  // Find the next logical step ID
  findNextStepId: (progress: UserProgress): string | null => {
    const workflow = workflowService.getWorkflow();
    if (!workflow || !progress.currentStepId) return null;

    // Get all steps in order
    const allStepsInOrder = workflow.sections
      .flatMap((section) => section.steps)
      .sort((a, b) => a.order - b.order);

    // Find current step index
    const currentIndex = allStepsInOrder.findIndex(
      (step) => step.id === progress.currentStepId
    );
    if (currentIndex === -1 || currentIndex >= allStepsInOrder.length - 1)
      return null;

    // Return next step ID
    return allStepsInOrder[currentIndex + 1].id;
  },

  // Add a message to a step
  addMessage: (
    progress: UserProgress,
    stepId: string,
    message: Message
  ): UserProgress => {
    const stepProgress = progress.stepProgress[stepId];

    if (!stepProgress) {
      console.error(`Cannot add message: step ${stepId} not found`);
      return progress;
    }

    const messages = stepProgress.messages || [];

    const updatedStepProgress = {
      ...stepProgress,
      messages: [...messages, message],
      lastModified: new Date(),
    };

    return {
      ...progress,
      stepProgress: {
        ...progress.stepProgress,
        [stepId]: updatedStepProgress,
      },
      sessionData: {
        ...progress.sessionData,
        lastActivityAt: new Date(),
      },
    };
  },

  // Update all messages for a step
  updateStepMessages: (
    progress: UserProgress,
    stepId: string,
    messages: Message[]
  ): UserProgress => {
    const stepProgress = progress.stepProgress[stepId];

    if (!stepProgress) {
      console.error(`Cannot update messages: step ${stepId} not found`);
      return progress;
    }

    const updatedStepProgress = {
      ...stepProgress,
      messages: messages,
      lastModified: new Date(),
    };

    return {
      ...progress,
      stepProgress: {
        ...progress.stepProgress,
        [stepId]: updatedStepProgress,
      },
      sessionData: {
        ...progress.sessionData,
        lastActivityAt: new Date(),
      },
    };
  },

  // Add captured data to a step
  addCapturedData: (
    progress: UserProgress,
    stepId: string,
    capturedData: CapturedData[]
  ): UserProgress => {
    const stepProgress = progress.stepProgress[stepId];

    if (!stepProgress) {
      console.error(`Cannot add captured data: step ${stepId} not found`);
      return progress;
    }

    const existingData = stepProgress.capturedData || [];

    // Merge data, replacing items with the same label
    const mergedData = [...existingData];

    capturedData.forEach((item) => {
      const existingIndex = mergedData.findIndex(
        (existing) => existing.label === item.label
      );

      if (existingIndex !== -1) {
        // Replace existing item
        mergedData[existingIndex] = item;
      } else {
        // Add new item
        mergedData.push(item);
      }
    });

    const updatedStepProgress = {
      ...stepProgress,
      capturedData: mergedData,
      lastModified: new Date(),
    };

    return {
      ...progress,
      stepProgress: {
        ...progress.stepProgress,
        [stepId]: updatedStepProgress,
      },
      sessionData: {
        ...progress.sessionData,
        lastActivityAt: new Date(),
      },
    };
  },
};

// Helper function to update overall progress stats
function updateOverallProgress(progress: UserProgress): UserProgress {
  // Count completed steps
  const completedSteps = Object.values(progress.stepProgress).filter(
    (step) => step.status === "complete"
  ).length;

  // Calculate percentage
  const totalSteps = progress.overallProgress.totalSteps;
  const percentComplete =
    totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Calculate time spent
  const startTime = new Date(progress.sessionData.startedAt).getTime();
  const currentTime = new Date().getTime();
  const timeSpentMinutes = Math.round((currentTime - startTime) / 60000);

  return {
    ...progress,
    overallProgress: {
      ...progress.overallProgress,
      completedSteps,
      percentComplete,
    },
    sessionData: {
      ...progress.sessionData,
      timeSpentMinutes,
    },
  };
}
```

### 3. Update StepItem Component

Update the StepItem component to display captured data:

```tsx
// In src/components/StepItem.tsx
import React from "react";
import { Check, Circle, AlertCircle, Play, Pause } from "lucide-react";
import { StepStatus, CapturedData } from "../types/userProgress";
import { CapturedDataDisplay } from "./CapturedDataDisplay";

interface StepItemProps {
  id: string;
  title: string;
  status: StepStatus;
  onClick: () => void;
  disabled?: boolean;
  capturedData?: CapturedData[];
}

export const StepItem: React.FC<StepItemProps> = ({
  id,
  title,
  status,
  onClick,
  disabled = false,
  capturedData,
}) => {
  // Existing component implementation...

  return (
    <div className={/* existing styles */}>
      <div className="flex items-center">{/* Existing content */}</div>

      {/* Add captured data display for completed steps */}
      {status === "complete" && capturedData && capturedData.length > 0 && (
        <CapturedDataDisplay data={capturedData} stepTitle={title} />
      )}
    </div>
  );
};
```

### 4. Update Index Component

Update the Index component to handle progress updates:

```tsx
// In src/pages/Index.tsx
const {
  progress,
  loading: progressLoading,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateProgress, // Add this line
} = useProgress();

// Later in the JSX
<ChatInterface
  progress={progress}
  onCompleteStep={completeCurrentStep}
  onProgressUpdate={updateProgress} // Add this line
/>;
```

## Testing

After implementation, test the following:

1. Progress state persistence between page reloads
2. Step status transitions and logic
3. Message history persistence
4. Captured data storage and display
5. Step activation and completion rules
6. Session time tracking

## Notes

- The implementation focuses on in-memory and localStorage persistence
- For production use, consider adding server-side persistence
- Add error handling for storage failures
- Consider adding cleanup for old sessions to prevent localStorage overflow
