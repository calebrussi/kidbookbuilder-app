# Enhanced Chat Interface Implementation

## Overview

This document outlines the steps to enhance the basic chat interface in the voice-step-flow project to support actual chat functionality, message persistence, and advanced voice interaction capabilities.

## Objective

Transform the mock chat interface into a functional implementation that:

- Integrates with Eleven Labs React hooks
- Supports sophisticated message handling
- Provides debug functionality
- Implements voice interaction capabilities
- Displays captured data from completed steps

## Implementation Steps

### 1. Update UserProgress Types

Update the `userProgress.ts` file to include new message types and captured data structures:

```typescript
// Add new Message interface
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    transcribed?: boolean;
    captured?: boolean;
  };
}

// Update StepProgress to include messages
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
  messages?: Message[]; // Add this line
}
```

### 2. Create CapturedDataDisplay Component

Create a new component to display captured data from completed steps:

```tsx
// src/components/CapturedDataDisplay.tsx
import React from "react";
import { CapturedData } from "../types/userProgress";

interface CapturedDataDisplayProps {
  data: CapturedData[];
  stepTitle: string;
}

export const CapturedDataDisplay: React.FC<CapturedDataDisplayProps> = ({
  data,
  stepTitle,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
      <h4 className="text-sm font-medium text-green-800 mb-2">
        {stepTitle} - Captured Data
      </h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-green-700 font-medium">
              {item.label}:
            </span>
            <span className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Enhance ChatInterface Component

Replace the existing `ChatInterface.tsx` with an enhanced version that supports actual chat functionality:

```tsx
// src/components/ChatInterface.tsx
import React from "react";
import { Mic, MicOff, MessageCircle } from "lucide-react";
import { useConversation } from "@11labs/react";
import { UserProgress, CapturedData, Message } from "../types/userProgress";
import { workflowService } from "../services/workflowService";
import { progressService } from "../services/progressService";
import { ScrollArea } from "./ui/scroll-area";
import { CapturedDataDisplay } from "./CapturedDataDisplay";

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  onProgressUpdate?: (updatedProgress: UserProgress) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  onProgressUpdate,
}) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isListening, setIsListening] = React.useState(false);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<boolean>(false);

  // Debug logger function
  const logDebug = React.useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[ChatInterface Debug]", ...args);
      }
    },
    [debug]
  );

  // Toggle debug mode
  const toggleDebug = React.useCallback(() => {
    setDebug((prev) => {
      const newValue = !prev;
      console.log(`Debug mode ${newValue ? "enabled" : "disabled"}`);
      return newValue;
    });
  }, []);

  // Format timestamp to local time string
  const formatTimestamp = (timestamp: Date | string): string => {
    if (typeof timestamp === "string") {
      return new Date(timestamp).toLocaleTimeString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString();
    }
    return "";
  };

  // Load existing messages on component mount
  React.useEffect(() => {
    if (progress && progress.currentStepId) {
      const currentStep = progress.stepProgress[progress.currentStepId];
      if (
        currentStep &&
        currentStep.messages &&
        currentStep.messages.length > 0
      ) {
        setMessages(currentStep.messages);
        logDebug("Loaded existing messages:", currentStep.messages);
      } else {
        // Initialize with welcome message if no messages exist
        const welcomeMessage: Message = {
          id: `system_${Date.now()}`,
          role: "assistant",
          content:
            "Hello! I'm here to help you complete your character creation quiz. Let's start with the current step.",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);

        // Save welcome message to progress if onProgressUpdate is available
        if (onProgressUpdate) {
          const updatedProgress = progressService.addMessage(
            progress,
            progress.currentStepId,
            welcomeMessage
          );
          onProgressUpdate(updatedProgress);
        }
      }
    }
  }, [progress.currentStepId]);

  // Toggle listening state
  const toggleListening = React.useCallback(() => {
    setIsListening((prev) => !prev);

    // Example: Simulate receiving a message when listening starts
    if (!isListening) {
      setTimeout(() => {
        const botMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content:
            "I'm listening! Please tell me about your preferences for this step.",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);

        // Save bot message to progress if onProgressUpdate is available
        if (onProgressUpdate) {
          const updatedProgress = progressService.addMessage(
            progress,
            progress.currentStepId,
            botMessage
          );
          onProgressUpdate(updatedProgress);
        }
      }, 1000);
    }
  }, [isListening, progress, progress.currentStepId, onProgressUpdate]);

  // Get the current step title
  const currentStepTitle = React.useMemo(() => {
    if (!progress || !progress.currentStepId) return "";

    const allSections = workflowService.getWorkflow()?.sections || [];
    for (const section of allSections) {
      const step = section.steps.find((s) => s.id === progress.currentStepId);
      if (step) return step.title;
    }
    return "";
  }, [progress.currentStepId]);

  // Get captured data for the current step
  const currentStepCapturedData = React.useMemo(() => {
    if (!progress || !progress.currentStepId) return [];
    return progress.stepProgress[progress.currentStepId]?.capturedData || [];
  }, [progress.currentStepId, progress.stepProgress]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="text-center space-y-4 mb-6">
        <div className="space-y-2">
          <MessageCircle className="w-12 h-12 text-purple-500 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900">
            Voice Chat Interface
          </h3>
          <p className="text-gray-600">
            Speak with your AI assistant to complete the current step
          </p>
        </div>

        {progress.currentStepId && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Current Step:</p>
            <p className="text-purple-800">{currentStepTitle}</p>
          </div>
        )}

        {/* Display captured data if available */}
        {currentStepCapturedData.length > 0 && (
          <CapturedDataDisplay
            data={currentStepCapturedData}
            stepTitle={currentStepTitle}
          />
        )}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation</h4>
        <ScrollArea className="h-64 border border-gray-200 rounded-lg">
          <div className="p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-purple-500 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.role === "user"
                        ? "text-purple-200"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Voice Interface */}
      <div className="text-center space-y-4">
        <button
          onClick={toggleListening}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center mx-auto
            transition-all duration-200 transform hover:scale-105
            ${
              isListening
                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                : "bg-purple-500 hover:bg-purple-600"
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        <p className="text-sm text-gray-500">
          {isListening
            ? "Listening... Click to stop"
            : "Click to start speaking"}
        </p>

        {/* Debug toggle button - only in development */}
        {process.env.NODE_ENV === "development" && (
          <button
            onClick={toggleDebug}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {debug ? "Disable Debug Mode" : "Enable Debug Mode"}
          </button>
        )}
      </div>
    </div>
  );
};
```

### 4. Update useProgress Hook

Enhance the `useProgress` hook to support message management and captured data:

```typescript
// Add updateProgress function to useProgress hook
const updateProgress = useCallback((updatedProgress: UserProgress) => {
  setProgress(updatedProgress);
  storageService.saveUserProgress(updatedProgress);
}, []);
```

### 5. Update the ProgressService

Enhance the progress service to handle messages:

```typescript
// Add to progressService.ts
export const addMessage = (
  progress: UserProgress,
  stepId: string,
  message: Message
): UserProgress => {
  const stepProgress = progress.stepProgress[stepId];

  if (!stepProgress) return progress;

  const updatedStepProgress = {
    ...stepProgress,
    messages: [...(stepProgress.messages || []), message],
    lastModified: new Date(),
  };

  return {
    ...progress,
    stepProgress: {
      ...progress.stepProgress,
      [stepId]: updatedStepProgress,
    },
  };
};
```

### 6. Update the Index Page

Update the Index component to pass the new `onProgressUpdate` prop:

```tsx
// In Index.tsx, update the ChatInterface component
<ChatInterface
  progress={progress}
  onCompleteStep={completeCurrentStep}
  onProgressUpdate={updateProgress}
/>
```

## Testing

After implementation, test the following:

1. Message persistence between page reloads
2. Voice interaction simulation
3. Display of captured data
4. Debug mode functionality in development

## Notes

- The actual voice integration will require Eleven Labs or another voice API provider
- For this implementation, we're using simulated voice interactions
- The debug mode should only be available in development environments
