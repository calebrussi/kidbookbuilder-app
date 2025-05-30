# Update - Message Storage Integration

## How to Use This Document

This document provides a comprehensive guide for adding message storage functionality to the voice-step-flow application. This update allows the app to store conversation messages in the user progress state, providing conversation history persistence and better traceability across sessions.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-MessageStorageIntegration.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `outputs/web-app/v4/voice-step-flow/src/types/userProgress.ts`
- `outputs/web-app/v4/voice-step-flow/src/services/progressService.ts`
- `outputs/web-app/v4/voice-step-flow/src/hooks/useElevenLabsConversation.ts`
- `outputs/web-app/v4/voice-step-flow/src/components/ChatInterface.tsx`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

Update the voice-step-flow application to store all conversation messages (both user and AI responses) in the user progress state. This feature will allow message history to persist across sessions and provide complete conversation context when reviewing user interactions.

The update involves four main components:

1. Adding a Message interface to the userProgress types
2. Adding a messages array to the StepProgress interface
3. Creating a new addMessage method in the progressService
4. Integrating the ElevenLabs websocket communication with the progress service

---

## 1. Update UserProgress Types

### Task:

Add a Message interface to the userProgress types and update the StepProgress interface to include a messages array.

### Instructions:

1. Create a new Message interface in userProgress.ts
2. Add a messages array to the StepProgress interface

### Files Modified:

- `src/types/userProgress.ts` - Added Message interface and messages array to StepProgress

```typescript
// Add Message interface after CapturedData interface
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
  messages: Message[]; // Add this line
}
```

---

## 2. Update ProgressService

### Task:

Add a new method to the ProgressService class to handle adding messages to the user progress.

### Instructions:

1. Create a new addMessage method in the ProgressService class
2. Update the createNewProgress method to initialize the messages array

### Files Modified:

- `src/services/progressService.ts` - Added addMessage method and updated createNewProgress

```typescript
// Import the Message type at the top of the file
import { UserProgress, StepProgress, StepStatus, CapturedData, Message } from '../types/userProgress';

// Update the createNewProgress method to initialize the messages array
createNewProgress(sessionId: string, workflowId: string): UserProgress {
  const allSteps = workflowService.getAllSteps();
  const stepProgress: Record<string, StepProgress> = {};

  // Initialize all steps as not_started, except the first one
  allSteps.forEach((item, index) => {
    const stepId = item.step.id;
    stepProgress[stepId] = {
      stepId,
      status: index === 0 ? 'in_progress' : 'not_started',
      conversationId: '',
      lastModified: new Date(),
      attemptCount: 0,
      messages: [] // Initialize empty messages array
    };
  });

  // ... rest of the method remains unchanged
}

// Add new addMessage method after updateStepConversationId
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

---

## 3. Update ElevenLabs Conversation Hook

### Task:

Update the ElevenLabsConversation hook to include the source field in messages and expose the conversation object.

### Instructions:

1. Add a source field to the ElevenLabsMessage interface
2. Modify the onMessage handler to include the source in messages
3. Expose the conversation object in the hook's return value

### Files Modified:

- `src/hooks/useElevenLabsConversation.ts` - Updated interface and hook implementation

```typescript
// Update ElevenLabsMessage interface
export interface ElevenLabsMessage {
  id: string;
  content: string;
  source?: "user" | "ai"; // Add source field
  timestamp: Date;
  isBot: boolean;
  agentId?: string;
}

// Update onMessage handler to include source from ElevenLabs
onMessage: (message) => {
  console.log("ElevenLabs message received:", message);
  const elevenLabsMessage: ElevenLabsMessage = {
    id: Date.now().toString(),
    source: message.source, // Include source from ElevenLabs
    content: message.message,
    timestamp: new Date(),
    isBot: true,
    agentId: agentId,
  };
  setMessages((prev) => [...prev, elevenLabsMessage]);
  onMessage?.(elevenLabsMessage);
};

// Expose conversation object in return value
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

---

## 4. Integrate with ChatInterface Component

### Task:

Update the ChatInterface component to save messages to the user progress.

### Instructions:

1. Import the progressService
2. Add state to track current progress
3. Update the onMessage handler to save AI messages to progress
4. Create a sendUserMessage function to save user messages to progress

### Files Modified:

- `src/components/ChatInterface.tsx` - Updated to integrate with progressService

```typescript
// Import progressService at the top of the file
import { progressService } from "../services/progressService";

// Add state tracking for current progress
const [currentProgress, setCurrentProgress] = React.useState(progress);

React.useEffect(() => {
  setCurrentProgress(progress);
}, [progress]);

// Update the onMessage handler in useElevenLabsConversation
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
        role: "assistant",
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
};

// Add sendUserMessage function
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

---

## Verification

After applying these changes, verify the following:

1. The application should still function as before with no regressions
2. When voice conversations occur, both user and AI messages should be stored in the user progress
3. The messages should persist in LocalStorage when the user refreshes the page
4. You can view the messages in the browser's developer tools by examining the LocalStorage

---

## Rollback Plan

If issues are encountered during implementation, the following steps can be taken to rollback the changes:

1. Revert the changes to userProgress.ts, removing the Message interface and messages array
2. Revert the changes to progressService.ts, removing the addMessage method and reverting createNewProgress
3. Revert the changes to useElevenLabsConversation.ts, removing the source field
4. Revert the changes to ChatInterface.tsx, removing the message storage integration
