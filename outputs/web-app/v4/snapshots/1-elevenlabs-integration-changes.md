# ElevenLabs Integration Changes Snapshot

This document provides a comprehensive overview of all changes applied to the `src-original` folder to create the current state of the `src` folder. These changes were implemented according to several update prompts detailed below.

## Files Changed Summary

Below is a summary of all files that were modified or created as part of the ElevenLabs integration:

### New Files Created

1. `.env.example` - Added environment configuration template
2. `.env` - Added actual environment configuration
3. `/src/hooks/useElevenLabsConversation.ts` - Created hook for ElevenLabs WebSocket integration

### Files Modified

1. `/src/types/userProgress.ts`

   - Added Message interface
   - Updated StepProgress interface to include messages, analysis, success, and conversationStatus fields

2. `/src/services/progressService.ts`

   - Updated createNewProgress to initialize messages array
   - Added updateStepConversationId method
   - Added addMessage method
   - Added updateStepConversationProgress method

3. `/src/hooks/useProgress.ts`

   - Added updateStepConversationId function
   - Added updateStepConversationProgress function
   - Updated return object to include new functions

4. `/src/components/ChatInterface.tsx`

   - Added state tracking for current progress
   - Updated component props to include onConversationIdUpdate and onConversationProgressUpdate
   - Enhanced onMessage, onConnect, and onDisconnect callbacks
   - Added sendUserMessage function
   - Updated UI to display message history and connection status

5. `/src/pages/Index.tsx`
   - Updated useProgress hook destructuring to include new functions
   - Enhanced ChatInterface props to include new callback functions
   - Added getCurrentStepAgentId function

## Update 1: ElevenLabs WebSocket Integration

This update introduced real-time voice conversations with ElevenLabs WebSocket integration.

### 1. Environment Configuration

**Created `.env.example` file:**

```env
# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: If using signed URLs, add your API key
# VITE_ELEVENLABS_API_KEY=your_api_key_here
```

**Created `.env` file:**

```env
# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your_selected_agent_id_from_workflow

# Optional: If using signed URLs, add your API key
# VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### 2. Created ElevenLabs Conversation Hook

**Created new file: `/src/hooks/useElevenLabsConversation.ts`**

```typescript
import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";

export interface ElevenLabsMessage {
  id: string;
  content: string;
  source?: "user" | "ai"; // Add source field
  timestamp: Date;
  isBot: boolean;
  agentId?: string;
}

interface UseElevenLabsConversationProps {
  agentId?: string;
  onMessage?: (message: ElevenLabsMessage) => void;
  onConnect?: (props?: any) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useElevenLabsConversation({
  agentId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseElevenLabsConversationProps) {
  const [messages, setMessages] = useState<ElevenLabsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: (props) => {
      console.log("ElevenLabs conversation connected", props);
      setError(null);
      onConnect?.(props);
    },
    onDisconnect: () => {
      console.log("ElevenLabs conversation disconnected");
      onDisconnect?.();
    },
    onMessage: (message) => {
      console.log("ElevenLabs message received:", message);
      const elevenLabsMessage: ElevenLabsMessage = {
        id: Date.now().toString(),
        source: message.source, // Include source from ElevenLabs
        content:
          message.message || "I heard you, but I'm processing your request...",
        timestamp: new Date(),
        isBot: true,
        agentId: agentId,
      };

      setMessages((prev) => [...prev, elevenLabsMessage]);
      onMessage?.(elevenLabsMessage);
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : "Connection error. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  const startConversation = useCallback(
    async (customAgentId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const targetAgentId =
          customAgentId || agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;

        if (!targetAgentId) {
          throw new Error(
            "No agent ID provided. Please set VITE_ELEVENLABS_AGENT_ID in your environment variables."
          );
        }

        // Start the conversation with the agent
        await conversation.startSession({
          agentId: targetAgentId,
        });
      } catch (error) {
        console.error("Failed to start ElevenLabs conversation:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to start conversation";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, agentId, onMessage, onError]
  );

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();

      const endMessage: ElevenLabsMessage = {
        id: "end-" + Date.now(),
        content: "Conversation ended. Click start to begin a new conversation.",
        timestamp: new Date(),
        isBot: true,
      };

      setMessages((prev) => [...prev, endMessage]);
    } catch (error) {
      console.error("Failed to stop conversation:", error);
    }
  }, [conversation]);

  const addUserMessage = useCallback((content: string) => {
    const userMessage: ElevenLabsMessage = {
      id: "user-" + Date.now(),
      content,
      timestamp: new Date(),
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    return userMessage;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    addUserMessage,
    clearMessages,
    setError,
    conversation, // Expose the conversation object for direct access
  };
}
```

### 3. Enhanced Chat Interface Component

**Updated file: `/src/components/ChatInterface.tsx`**

```tsx
import React from "react";
import { Mic, MicOff, MessageCircle, AlertCircle } from "lucide-react";
import { UserProgress, CapturedData } from "../types/userProgress";
import { ScrollArea } from "./ui/scroll-area";
import {
  useElevenLabsConversation,
  ElevenLabsMessage,
} from "../hooks/useElevenLabsConversation";
import { progressService } from "../services/progressService";

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  agentId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  agentId,
}) => {
  const stepProgress = progress.stepProgress[progress.currentStepId];
  const stepTitle = stepProgress
    ? Object.values(progress.stepProgress).find(
        (sp) => sp.stepId === progress.currentStepId
      )?.stepId
    : "";

  // Get the agent ID for the current step
  const getCurrentStepAgentId = () => {
    // Use the agent ID passed as prop, or fall back to environment variable
    return agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  };

  const {
    messages,
    isLoading,
    error,
    startConversation,
    stopConversation,
    addUserMessage,
    status,
    isSpeaking,
  } = useElevenLabsConversation({
    agentId: getCurrentStepAgentId(),
    onMessage: (message: ElevenLabsMessage) => {
      console.log("Chat interface received message:", message);
    },
    onConnect: (props) => {
      console.log("Chat interface: ElevenLabs connected", props);
    },
    onDisconnect: () => {
      console.log("Chat interface: ElevenLabs disconnected");
    },
    onError: (error: string) => {
      console.error("Chat interface: ElevenLabs error:", error);
    },
  });

  const handleStartConversation = async () => {
    await startConversation(getCurrentStepAgentId());
  };

  const handleStopConversation = async () => {
    await stopConversation();
  };

  const isConnected = status === "connected";
  const isConnecting = status === "connecting" || isLoading;

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

        {stepProgress && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">Current Step:</p>
            <p className="text-purple-800">{stepTitle}</p>
          </div>
        )}

        {/* Connection Status */}
        <div
          className={`flex items-center justify-center gap-2 text-sm ${
            isConnected
              ? "text-green-600"
              : error
              ? "text-red-600"
              : "text-gray-500"
          }`}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected
                ? "bg-green-500 animate-pulse"
                : error
                ? "bg-red-500"
                : "bg-gray-400"
            }`}
          ></div>
          <span>
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected"
              : error
              ? "Disconnected"
              : "Ready to connect"}
          </span>
          {isSpeaking && <span className="text-blue-600">(Speaking)</span>}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation</h4>
        <ScrollArea className="h-64 border border-gray-200 rounded-lg">
          <div className="p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No messages yet. Start a conversation to begin!</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isBot
                        ? "bg-gray-100 text-gray-800"
                        : "bg-purple-500 text-white"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.isBot ? "text-gray-500" : "text-purple-200"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-4">
        {!isConnected ? (
          <button
            onClick={handleStartConversation}
            disabled={isConnecting}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg border 
              ${
                isConnecting
                  ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-green-50 border-green-200 text-green-600 hover:bg-green-100"
              }
            `}
          >
            <Mic className="w-4 h-4" />
            {isConnecting ? "Connecting..." : "Start Conversation"}
          </button>
        ) : (
          <button
            onClick={handleStopConversation}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
          >
            <MicOff className="w-4 h-4" />
            End Conversation
          </button>
        )}

        {/* Complete Step Button */}
        <button
          onClick={() => onCompleteStep()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100"
        >
          Complete Step
        </button>
      </div>
    </div>
  );
};
```

### 4. Updated Index Component

**Updated file: `/src/pages/Index.tsx`**

```tsx
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
  } = useProgress();

  if (workflowLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-purple-600 font-medium">Loading your quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !workflow || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-xl font-semibold text-red-800">
            Oops! Something went wrong
          </h1>
          <p className="text-red-600">{error || "Failed to load the quiz"}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getCurrentStepAgentId = () => {
    if (!progress || !workflow) return undefined;

    return workflow.sections
      .flatMap((s) => s.steps)
      .find((step) => step.id === progress.currentStepId)?.agentId;
  };

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
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
```

## Update 2: Conversation ID Tracking

This update added conversation ID tracking to associate user interactions with specific ElevenLabs conversations.

### 1. Updated useProgress Hook

**Updated file: `/src/hooks/useProgress.ts`**

```typescript
// Add new function to track conversation IDs
const updateStepConversationId = useCallback(
  (stepId: string, conversationId: string) => {
    if (!progress) return;

    const updatedProgress = progressService.updateStepConversationId(
      progress,
      stepId,
      conversationId
    );
    setProgress(updatedProgress);
    storageService.saveUserProgress(updatedProgress);
  },
  [progress]
);

// Add to return object
return {
  progress,
  loading,
  updateStepStatus,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateStepConversationId,
};
```

### 2. Updated Index Component

**Updated file: `/src/pages/Index.tsx`**

```typescript
const {
  progress,
  loading: progressLoading,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateStepConversationId,
} = useProgress();

// Updated ChatInterface component in the return section
<ChatInterface
  progress={progress}
  onCompleteStep={completeCurrentStep}
  agentId={getCurrentStepAgentId()}
  onConversationIdUpdate={updateStepConversationId}
/>;
```

### 3. Updated ChatInterface Component

**Updated file: `/src/components/ChatInterface.tsx`**

```typescript
interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  agentId?: string;
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  agentId,
  onConversationIdUpdate,
}) => {
  // Added state tracking for current progress
  const [currentProgress, setCurrentProgress] = React.useState(progress);

  React.useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);

  // Updated onConnect callback
  const {
    // ...other properties
  } = useElevenLabsConversation({
    // ...other properties
    onConnect: (props) => {
      console.log("Chat interface: ElevenLabs connected", props);

      // Generate a conversation ID and update the progress when connected
      if (onConversationIdUpdate && progress && props) {
        onConversationIdUpdate(progress.currentStepId, props.conversationId);
      }
    },
    // ...other callbacks
  });
};
```

### 4. Updated ProgressService

**Updated file: `/src/services/progressService.ts`**

```typescript
// This method was already present or added in this update
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
```

## Update 3: Message Storage Integration

This update added the ability to store conversation messages in the user progress state.

### 1. Updated UserProgress Types

**Updated file: `/src/types/userProgress.ts`**

```typescript
export interface Message {
  id: string;
  content: string;
  role: "user" | "ai";
  timestamp: Date;
}

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
  messages: Message[]; // Added this field
}
```

### 2. Updated ProgressService

**Updated file: `/src/services/progressService.ts`**

```typescript
// Updated imports
import { UserProgress, StepProgress, StepStatus, CapturedData, Message } from '../types/userProgress';

// Updated createNewProgress method
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
      messages: [] // Initialize empty messages array
    };
  });

  // ...rest of method unchanged
}

// Added new method
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
```

### 3. Updated ElevenLabs Conversation Hook

**Updated file: `/src/hooks/useElevenLabsConversation.ts`**

```typescript
export interface ElevenLabsMessage {
  id: string;
  content: string;
  source?: "user" | "ai"; // Added source field
  timestamp: Date;
  isBot: boolean;
  agentId?: string;
}

// In the onMessage handler:
onMessage: (message) => {
  console.log("ElevenLabs message received:", message);
  const elevenLabsMessage: ElevenLabsMessage = {
    id: Date.now().toString(),
    source: message.source, // Include source from ElevenLabs
    content:
      message.message || "I heard you, but I'm processing your request...",
    timestamp: new Date(),
    isBot: true,
    agentId: agentId,
  };

  setMessages((prev) => [...prev, elevenLabsMessage]);
  onMessage?.(elevenLabsMessage);
},

// In the return object:
return {
  messages,
  isLoading,
  error,
  status: conversation.status,
  isSpeaking: conversation.isSpeaking,
  startConversation,
  stopConversation,
  addUserMessage,
  clearMessages,
  setError,
  conversation, // Expose the conversation object for direct access
};
```

### 4. Updated ChatInterface Component

**Updated file: `/src/components/ChatInterface.tsx`**

```typescript
// Added import for progressService
import { progressService } from "../services/progressService";

// Added message handling
const {
  messages,
  isLoading,
  error,
  startConversation,
  stopConversation,
  addUserMessage,
  status,
  isSpeaking,
} = useElevenLabsConversation({
  agentId: getCurrentStepAgentId(),
  onMessage: (message: ElevenLabsMessage) => {
    console.log("Chat interface received message:", message);

    // Only process assistant messages here (user messages are handled in the sendMessage function)
    if (message.isBot && currentProgress) {
      // Save the assistant message to the user's progress
      const updatedProgress = progressService.addMessage(
        currentProgress,
        currentProgress.currentStepId,
        {
          content: message.content,
          role: message.source,
        }
      );

      // Update the current progress state
      setCurrentProgress(updatedProgress);

      // If we have access to storage service, update the progress there too
      if (onConversationIdUpdate) {
        onConversationIdUpdate(
          updatedProgress.currentStepId,
          updatedProgress.stepProgress[updatedProgress.currentStepId]
            .conversationId
        );
      }
    }
  },
  // ...other callbacks
});

// Added sendUserMessage function
const sendUserMessage = (content: string) => {
  if (!content.trim() || !isConnected) return;

  // Use the addUserMessage from ElevenLabs hook to add the message to the UI
  const message = addUserMessage(content);

  // Save the user message to progress
  if (currentProgress) {
    const updatedProgress = progressService.addMessage(
      currentProgress,
      currentProgress.currentStepId,
      {
        content: content,
        role: "user",
      }
    );

    setCurrentProgress(updatedProgress);

    // If we have a way to update the conversation ID, use it
    if (onConversationIdUpdate) {
      onConversationIdUpdate(
        updatedProgress.currentStepId,
        updatedProgress.stepProgress[updatedProgress.currentStepId]
          .conversationId
      );
    }
  }
};
```

## Update 4: Conversation Progress Tracking

This update added conversation progress tracking to process and store data returned from the conversation API.

### 1. Updated StepProgress Interface

**Updated file: `/src/types/userProgress.ts`**

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
  messages: Message[]; // Array to store conversation messages
  analysis?: any[]; // Analysis data from conversation API
  success?: boolean; // Whether the conversation was successful
  conversationStatus?: string; // Status of the conversation
}
```

### 2. Added updateStepConversationProgress Method to ProgressService

**Updated file: `/src/services/progressService.ts`**

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

### 3. Added updateStepConversationProgress to useProgress Hook

**Updated file: `/src/hooks/useProgress.ts`**

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
    storageService.saveUserProgress(updatedProgress);

    // If the step was marked as complete and there's a next step, activate it
    if (progressData.success === true) {
      const nextStepId = progressService.getNextStep(updatedProgress);
      if (nextStepId) {
        setTimeout(() => updateStepStatus(nextStepId, "in_progress"), 1000);
      }
    }
  },
  [progress, updateStepStatus]
);

// Update the return object
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

### 4. Updated the Index Component

**Updated file: `/src/pages/Index.tsx`**

```typescript
const {
  progress,
  loading: progressLoading,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateStepConversationId,
  updateStepConversationProgress,
} = useProgress();

// Update the ChatInterface component in the return section
<ChatInterface
  progress={progress}
  onCompleteStep={completeCurrentStep}
  agentId={getCurrentStepAgentId()}
  onConversationIdUpdate={updateStepConversationId}
  onConversationProgressUpdate={updateStepConversationProgress}
/>;
```

### 5. Updated the ChatInterface Component

**Updated file: `/src/components/ChatInterface.tsx`**

```typescript
interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  agentId?: string;
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
  onConversationProgressUpdate?: (stepId: string, progressData: any) => void; // Added new prop
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  agentId,
  onConversationIdUpdate,
  onConversationProgressUpdate,
}) => {
  // ...existing code

  // Updated onDisconnect callback
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
  // ...existing code
};
```

## Summary of Changes

The changes implemented across these updates have transformed the application into a full-featured voice-enabled application with ElevenLabs integration. The key features added include:

1. Real-time voice conversations through ElevenLabs WebSocket integration
2. Conversation ID tracking for better traceability
3. Message storage for conversation history persistence
4. Conversation progress tracking for workflow advancement

These updates have been carefully implemented to work together seamlessly and provide a robust user experience with voice-enabled AI conversations that maintain state and progress across the workflow.

## Detailed List of File Changes

This section provides a line-by-line summary of all the changes made to each file, including specific code snippets:

### 1. `.env.example` (New File)

- Created a template environment configuration file with ElevenLabs settings:

```env
# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# Optional: If using signed URLs, add your API key
# VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### 2. `.env` (New File)

- Added actual environment configuration with the ElevenLabs agent ID:

```env
# ElevenLabs Configuration
VITE_ELEVENLABS_AGENT_ID=your_selected_agent_id_from_workflow

# Optional: If using signed URLs, add your API key
# VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### 3. `/src/hooks/useElevenLabsConversation.ts` (New File)

- Created complete WebSocket integration hook with:

  - ElevenLabsMessage interface definition:

  ```typescript
  export interface ElevenLabsMessage {
    id: string;
    content: string;
    source?: "user" | "ai";
    timestamp: Date;
    isBot: boolean;
    agentId?: string;
  }
  ```

  - UseElevenLabsConversationProps interface:

  ```typescript
  interface UseElevenLabsConversationProps {
    agentId?: string;
    onMessage?: (message: ElevenLabsMessage) => void;
    onConnect?: (props?: any) => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
  }
  ```

  - Message state management:

  ```typescript
  const [messages, setMessages] = useState<ElevenLabsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  ```

  - Connection status handling via the hook's return value:

  ```typescript
  return {
    messages,
    isLoading,
    error,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    addUserMessage,
    clearMessages,
    setError,
    conversation,
  };
  ```

  - WebSocket event callbacks:

  ```typescript
  const conversation = useConversation({
    onConnect: (props) => {
      console.log("ElevenLabs conversation connected", props);
      setError(null);
      onConnect?.(props);
    },
    onDisconnect: () => {
      console.log("ElevenLabs conversation disconnected");
      onDisconnect?.();
    },
    onMessage: (message) => {
      console.log("ElevenLabs message received:", message);
      const elevenLabsMessage: ElevenLabsMessage = {
        id: Date.now().toString(),
        source: message.source,
        content:
          message.message || "I heard you, but I'm processing your request...",
        timestamp: new Date(),
        isBot: true,
        agentId: agentId,
      };
      setMessages((prev) => [...prev, elevenLabsMessage]);
      onMessage?.(elevenLabsMessage);
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : "Connection error. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });
  ```

  - Conversation control methods:

  ```typescript
  const startConversation = useCallback(
    async (customAgentId?: string) => {
      setIsLoading(true);
      setError(null);
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const targetAgentId =
          customAgentId || agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;
        if (!targetAgentId) {
          throw new Error(
            "No agent ID provided. Please set VITE_ELEVENLABS_AGENT_ID in your environment variables."
          );
        }
        await conversation.startSession({ agentId: targetAgentId });
      } catch (error) {
        // Error handling
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, agentId, onMessage, onError]
  );

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      const endMessage: ElevenLabsMessage = {
        id: "end-" + Date.now(),
        content: "Conversation ended. Click start to begin a new conversation.",
        timestamp: new Date(),
        isBot: true,
      };
      setMessages((prev) => [...prev, endMessage]);
    } catch (error) {
      console.error("Failed to stop conversation:", error);
    }
  }, [conversation]);
  ```

  - User message handling:

  ```typescript
  const addUserMessage = useCallback((content: string) => {
    const userMessage: ElevenLabsMessage = {
      id: "user-" + Date.now(),
      content,
      timestamp: new Date(),
      isBot: false,
    };
    setMessages((prev) => [...prev, userMessage]);
    return userMessage;
  }, []);
  ```

### 4. `/src/types/userProgress.ts`

- Added Message interface with fields:
  ```typescript
  export interface Message {
    id: string;
    content: string;
    role: "user" | "ai";
    timestamp: Date;
  }
  ```
- Updated StepProgress interface to include:
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
    messages: Message[]; // Added this field
    analysis?: any[]; // Analysis data from conversation API
    success?: boolean; // Whether the conversation was successful
    conversationStatus?: string; // Status of the conversation
  }
  ```

### 5. `/src/services/progressService.ts`

- Updated imports to include the Message type:
  ```typescript
  import {
    UserProgress,
    StepProgress,
    StepStatus,
    CapturedData,
    Message,
  } from "../types/userProgress";
  ```
- Modified createNewProgress method to initialize messages array:

  ```typescript
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
        messages: [] // Initialize empty messages array
      };
    });
    // ...rest of method unchanged
  }
  ```

- Added updateStepConversationId method:

  ```typescript
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
  ```

- Added addMessage method:

  ```typescript
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
  ```

- Added updateStepConversationProgress method:

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

### 6. `/src/hooks/useProgress.ts`

- Added updateStepConversationId callback function:

  ```typescript
  const updateStepConversationId = useCallback(
    (stepId: string, conversationId: string) => {
      if (!progress) return;

      const updatedProgress = progressService.updateStepConversationId(
        progress,
        stepId,
        conversationId
      );
      setProgress(updatedProgress);
      storageService.saveUserProgress(updatedProgress);
    },
    [progress]
  );
  ```

- Added updateStepConversationProgress callback function:

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
      storageService.saveUserProgress(updatedProgress);

      // If the step was marked as complete and there's a next step, activate it
      if (progressData.success === true) {
        const nextStepId = progressService.getNextStep(updatedProgress);
        if (nextStepId) {
          setTimeout(() => updateStepStatus(nextStepId, "in_progress"), 1000);
        }
      }
    },
    [progress, updateStepStatus]
  );
  ```

- Updated return object to include the new callback functions:
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

### 7. `/src/components/ChatInterface.tsx`

- Updated imports to include progressService and ElevenLabsMessage:
  ```typescript
  import {
    useElevenLabsConversation,
    ElevenLabsMessage,
  } from "../hooks/useElevenLabsConversation";
  import { progressService } from "../services/progressService";
  ```
- Expanded ChatInterfaceProps interface:

  ```typescript
  interface ChatInterfaceProps {
    progress: UserProgress;
    onCompleteStep: (capturedData?: CapturedData[]) => void;
    agentId?: string;
    onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
    onConversationProgressUpdate?: (stepId: string, progressData: any) => void; // Added new prop
  }

  export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    progress,
    onCompleteStep,
    agentId,
    onConversationIdUpdate,
    onConversationProgressUpdate,
  }) => {
    // ...component implementation
  };
  ```

- Added state tracking for current progress:

  ```typescript
  // Add state tracking for current progress
  const [currentProgress, setCurrentProgress] = React.useState(progress);

  React.useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);
  ```

- Enhanced useElevenLabsConversation implementation:

  ```typescript
  const {
    messages,
    isLoading,
    error,
    startConversation,
    stopConversation,
    addUserMessage,
    status,
    isSpeaking,
  } = useElevenLabsConversation({
    agentId: getCurrentStepAgentId(),
    onMessage: (message: ElevenLabsMessage) => {
      console.log("Chat interface received message:", message);

      // Only process assistant messages here (user messages are handled in the sendMessage function)
      if (message.isBot && currentProgress) {
        // Save the assistant message to the user's progress
        const updatedProgress = progressService.addMessage(
          currentProgress,
          currentProgress.currentStepId,
          {
            content: message.content,
            role: message.source,
          }
        );

        // Update the current progress state
        setCurrentProgress(updatedProgress);

        // If we have access to storage service, update the progress there too
        if (onConversationIdUpdate) {
          onConversationIdUpdate(
            updatedProgress.currentStepId,
            updatedProgress.stepProgress[updatedProgress.currentStepId]
              .conversationId
          );
        }
      }
    },
    onConnect: (props) => {
      console.log("Chat interface: ElevenLabs connected", props);

      // Generate a conversation ID and update the progress when connected
      if (onConversationIdUpdate && progress && props) {
        onConversationIdUpdate(progress.currentStepId, props.conversationId);
      }
    },
    onDisconnect: () => {
      console.log("Chat interface: ElevenLabs disconnected");

      // Get the conversation ID from the current progress
      if (
        currentProgress &&
        currentProgress.stepProgress[currentProgress.currentStepId] &&
        currentProgress.stepProgress[currentProgress.currentStepId]
          .conversationId
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

            // Update the step progress with the conversation analysis
            const updatedProgress = {
              ...currentProgress,
              stepProgress: {
                ...currentProgress.stepProgress,
                [currentProgress.currentStepId]: {
                  ...currentProgress.stepProgress[
                    currentProgress.currentStepId
                  ],
                  analysis,
                  success,
                  status,
                },
              },
            };

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
    },
    onError: (error: string) => {
      console.error("Chat interface: ElevenLabs error:", error);
    },
  });
  ```

- Added sendUserMessage function:

  ```typescript
  const sendUserMessage = (content: string) => {
    if (!content.trim() || !isConnected) return;

    // Use the addUserMessage from ElevenLabs hook to add the message to the UI
    const message = addUserMessage(content);

    // Save the user message to progress
    if (currentProgress) {
      const updatedProgress = progressService.addMessage(
        currentProgress,
        currentProgress.currentStepId,
        {
          content: content,
          role: "user",
        }
      );

      setCurrentProgress(updatedProgress);

      // If we have a way to update the conversation ID, use it
      if (onConversationIdUpdate) {
        onConversationIdUpdate(
          updatedProgress.currentStepId,
          updatedProgress.stepProgress[updatedProgress.currentStepId]
            .conversationId
        );
      }
    }
  };
  ```

- Updated UI with connection and speaking status indicators:
  ```typescript
  {
    /* Connection Status */
  }
  <div
    className={`flex items-center justify-center gap-2 text-sm ${
      isConnected ? "text-green-600" : error ? "text-red-600" : "text-gray-500"
    }`}
  >
    <div
      className={`w-2 h-2 rounded-full ${
        isConnected
          ? "bg-green-500 animate-pulse"
          : error
          ? "bg-red-500"
          : "bg-gray-400"
      }`}
    ></div>
    <span>
      {isConnecting
        ? "Connecting..."
        : isConnected
        ? "Connected"
        : error
        ? "Disconnected"
        : "Ready to connect"}
    </span>
    {isSpeaking && <span className="text-blue-600">(Speaking)</span>}
  </div>;
  ```

### 8. `/src/pages/Index.tsx`

- Added updateStepConversationId and updateStepConversationProgress to useProgress hook destructuring:
  ```typescript
  const {
    progress,
    loading: progressLoading,
    activateStep,
    completeCurrentStep,
    canActivateStep,
    resetProgress,
    updateStepConversationId,
    updateStepConversationProgress,
  } = useProgress();
  ```
- Added getCurrentStepAgentId function:
  ```typescript
  const getCurrentStepAgentId = () => {
    if (!progress || !workflow) return undefined;

    return workflow.sections
      .flatMap((s) => s.steps)
      .find((step) => step.id === progress.currentStepId)?.agentId;
  };
  ```
- Updated ChatInterface component props:
  ```typescript
  <ChatInterface
    progress={progress}
    onCompleteStep={completeCurrentStep}
    agentId={getCurrentStepAgentId()}
    onConversationIdUpdate={updateStepConversationId}
    onConversationProgressUpdate={updateStepConversationProgress}
  />
  ```
