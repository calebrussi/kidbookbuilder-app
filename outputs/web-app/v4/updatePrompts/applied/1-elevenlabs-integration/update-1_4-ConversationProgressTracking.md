# Update - Conversation Progress Tracking

## How to Use This Document

This document provides a comprehensive guide for adding conversation progress tracking to the voice-step-flow application. This update allows the app to automatically process and store data returned from the conversation API when a conversation with an ElevenLabs agent ends, enabling smarter workflow progression.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-ConversationProgressTracking.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `outputs/web-app/v4/voice-step-flow/src/hooks/useProgress.ts`
- `outputs/web-app/v4/voice-step-flow/src/components/ChatInterface.tsx`
- `outputs/web-app/v4/voice-step-flow/src/services/progressService.ts`
- `outputs/web-app/v4/voice-step-flow/src/types/userProgress.ts`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

Update the voice-step-flow application to track and process conversation progress data when a conversation with an ElevenLabs agent ends. This feature will:

1. Update the user progress when a conversation completes
2. Store analysis data returned from the API
3. Automatically advance to the next step when a conversation is successful
4. Enable parent components to respond to conversation progress updates

---

## Implementation Steps

### Step 1: Update the StepProgress Interface

First, we need to update the `StepProgress` interface to include new fields for conversation analysis data.

**File: `/outputs/web-app/v4/voice-step-flow/src/types/userProgress.ts`**

```typescript
export interface StepProgress {
  stepId: string;
  status: StepStatus;
  conversationId: string;
  startedAt?: Date;
  completedAt?: Date;
  lastModified: Date;
  attemptCount: number;
  userInputs?: Record<string, any>;
  capturedData?: CapturedData[];
  messages: Message[];
  analysis?: any[]; // <-- Add this field
  success?: boolean; // <-- Add this field
  conversationStatus?: string; // <-- Add this field
}
```

### Step 2: Add the updateStepConversationProgress Method to ProgressService

Add a new method to handle updating the conversation progress in the progress service.

**File: `/outputs/web-app/v4/voice-step-flow/src/services/progressService.ts`**

```typescript
updateStepConversationProgress(
  progress: UserProgress,
  stepId: string,
  progressData: {
    analysis?: any[];
    success?: boolean;
    status?: string;
  }
): UserProgress {
  const updatedProgress = { ...progress };

  if (!updatedProgress.stepProgress[stepId]) return progress;

  // Update the progress data for the specific step
  updatedProgress.stepProgress[stepId] = {
    ...updatedProgress.stepProgress[stepId],
    analysis: progressData.analysis || updatedProgress.stepProgress[stepId].analysis,
    success: progressData.success !== undefined ? progressData.success : updatedProgress.stepProgress[stepId].success,
    conversationStatus: progressData.status || updatedProgress.stepProgress[stepId].conversationStatus,
    lastModified: new Date()
  };

  // If the conversation was successful, mark the step as complete
  if (progressData.success === true && updatedProgress.stepProgress[stepId].status !== 'complete') {
    updatedProgress.stepProgress[stepId].status = 'complete';
    updatedProgress.stepProgress[stepId].completedAt = new Date();

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
```

### Step 3: Add updateStepConversationProgress to the useProgress Hook

Add the corresponding method to the useProgress hook to expose the functionality.

**File: `/outputs/web-app/v4/voice-step-flow/src/hooks/useProgress.ts`**

```typescript
const updateStepConversationProgress = useCallback(
  (
    stepId: string,
    progressData: { analysis?: any[]; success?: boolean; status?: string }
  ) => {
    console.log(
      "useProgress::updateStepConversationProgress",
      stepId,
      progressData
    );

    if (!progress) return;

    const updatedProgress = progressService.updateStepConversationProgress(
      progress,
      stepId,
      progressData
    );
    setProgress(updatedProgress);

    console.log("Updated Progress:", updatedProgress);
    storageService.saveUserProgress(updatedProgress);

    // If the conversation was successful and it completed the step, check for next step
    if (
      progressData.success &&
      updatedProgress.stepProgress[stepId].status === "complete"
    ) {
      const nextStepId = progressService.getNextStep(updatedProgress);
      if (nextStepId) {
        setTimeout(() => updateStepStatus(nextStepId, "in_progress"), 300);
      }
    }
  },
  [progress, updateStepStatus]
);
```

Also update the return object to include the new method:

```typescript
return {
  progress,
  loading,
  updateStepStatus,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateStepConversationId,
  updateStepConversationProgress,
};
```

### Step 4: Update the ChatInterface Component Props

Update the ChatInterface component to accept an onConversationProgressUpdate prop.

**File: `/outputs/web-app/v4/voice-step-flow/src/components/ChatInterface.tsx`**

```typescript
interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  agentId?: string;
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
  onConversationProgressUpdate?: (stepId: string, progressData: any) => void; // <-- Add this prop
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  agentId,
  onConversationIdUpdate,
  onConversationProgressUpdate // <-- Add this prop
}) => {
  // ...existing code...
```

### Step 5: Update the onDisconnect Callback in ChatInterface

Modify the `onDisconnect` callback in the ChatInterface component to use the new `onConversationProgressUpdate` prop:

**File: `/outputs/web-app/v4/voice-step-flow/src/components/ChatInterface.tsx`**

```typescript
onDisconnect: () => {
  console.log("Chat interface: ElevenLabs disconnected");

  // Get the conversation ID from the current progress
  if (
    currentProgress &&
    currentProgress.stepProgress[currentProgress.currentStepId] &&
    currentProgress.stepProgress[currentProgress.currentStepId].conversationId
  ) {
    const conversationId =
      currentProgress.stepProgress[currentProgress.currentStepId]
        .conversationId;
    console.log(
      "Chat interface: Fetching conversation data for ID:",
      conversationId
    );

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

    // Make API call to the backend with the conversation ID
    fetch(`${apiBaseUrl}/api/conversation/${conversationId}`)
      .then((response) => response.json())
      .then((resp) => {
        console.log("API response for conversation:", resp);

        const analysis = resp.data.analysis || [];
        const success = resp.data.analysis?.call_successful || false;
        const status = resp.data.status;

        console.log(
          "Analysis:",
          analysis,
          "Success:",
          success,
          "Status:",
          status
        );

        // Update the step progress with the conversation analysis
        const updatedProgress = {
          ...currentProgress,
          stepProgress: {
            ...currentProgress.stepProgress,
            [currentProgress.currentStepId]: {
              ...currentProgress.stepProgress[currentProgress.currentStepId],
              analysis,
              success,
              status,
            },
          },
        };

        console.log(
          "Updated progress after conversation fetch:",
          updatedProgress
        );

        // Update the local state
        setCurrentProgress(updatedProgress);

        // If we have access to storage service, update the progress there too
        if (onConversationIdUpdate) {
          onConversationIdUpdate(
            updatedProgress.currentStepId,
            updatedProgress.stepProgress[updatedProgress.currentStepId]
              .conversationId
          );
        }

        // If we have a conversation progress update handler, use it
        if (onConversationProgressUpdate) {
          console.log("Calling onConversationProgressUpdate with:", {
            stepId: updatedProgress.currentStepId,
            progressData: { analysis, success, status },
          });
          onConversationProgressUpdate(updatedProgress.currentStepId, {
            analysis,
            success,
            status,
          });
        }
      })
      .catch((error) => {
        console.error("Error fetching conversation data:", error);
      });
  }
};
```

### Step 6: Use the updateStepConversationProgress in Index.tsx

Update the Index.tsx component to utilize the new conversation progress tracking functionality by passing the necessary props to ChatInterface.

**File: `/outputs/web-app/v4/voice-step-flow/src/pages/Index.tsx`**

```typescript
import React from "react";
import { WorkflowHeader } from "../components/WorkflowHeader";
import { StepList } from "../components/StepList";
import { ChatInterface } from "../components/ChatInterface";
import { useWorkflow } from "../hooks/useWorkflow";
import { useProgress } from "../hooks/useProgress";

const Index = () => {
  const { workflow, loading: workflowLoading, error } = useWorkflow();
  const {
    progress,
    loading: progressLoading,
    activateStep,
    completeCurrentStep,
    canActivateStep,
    resetProgress,
    updateStepConversationId,
    updateStepConversationProgress, // <-- Import the new method
  } = useProgress();

  // ...existing code...

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <WorkflowHeader
          title={workflow.title}
          progress={progress}
          onReset={resetProgress}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <StepList
              sections={workflow.sections}
              progress={progress}
              onStepClick={activateStep}
              canActivateStep={canActivateStep}
            />
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <ChatInterface
              progress={progress}
              onCompleteStep={completeCurrentStep}
              agentId={getCurrentStepAgentId()}
              onConversationIdUpdate={updateStepConversationId}
              onConversationProgressUpdate={updateStepConversationProgress} // <-- Pass the new prop
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
```

### Step 7: Set up Environment Variable for API Base URL

Finally, ensure the application can connect to the backend API by setting up an environment variable.

**Add to `.env` file:**

```
VITE_API_BASE_URL=http://localhost:3001
```

**IMPORTANT:** This variable would typically be set differently for production environments.

---

## Testing Guide

To test this implementation:

1. Start the voice-step-flow application
2. Start a conversation with an ElevenLabs agent
3. End the conversation
4. Observe the console logs to verify:
   - The API call to fetch conversation data is made
   - The conversation progress is updated
   - If the conversation was successful, the step is marked as complete
   - If applicable, the workflow advances to the next step

---

## Related Files

- `src/types/userProgress.ts`
- `src/services/progressService.ts`
- `src/hooks/useProgress.ts`
- `src/components/ChatInterface.tsx`
- `src/pages/Index.tsx` <!-- Added this file to the list -->

---

## Additional Notes

- The `onConversationProgressUpdate` prop is optional. If not provided, the app will still update the local progress state but won't notify parent components.
- The application now automatically marks a step as complete when the conversation is successful, advancing the workflow to the next step.
- The conversation analysis data from the API is stored in the step progress for later reference.
