# Agent Integration Implementation

## Overview

This document outlines the implementation of real agent integration with the workflow steps, replacing generic placeholder agent IDs with real, functional agent identifiers. This enables actual AI agent interactions rather than simulated ones.

## Objective

Transform the mock agent implementation to support:

- Real agent integration using unique identifiers
- Proper conversation management with agents
- Message history tracking
- Support for voice-based interactions

## Implementation Steps

### 1. Update Workflow Data

Update the workflow.json file to use real agent IDs instead of generic identifiers:

```json
// In src/data/workflow.json
{
  "id": "character-creation-quiz",
  "title": "Character Creation Quiz",
  "description": "Create your perfect story character through this interactive quiz",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "sections": [
    {
      "id": "story-style",
      "title": "Tell Me Your Story Style",
      "order": 1,
      "steps": [
        {
          "id": "favorite-stories",
          "title": "What stories do you love?",
          "order": 1,
          "sectionId": "story-style",
          "agentId": "agent_01jw9nbs4ye9hb450d9gdn16gx" // Update from "genre-agent"
        },
        {
          "id": "story-length",
          "title": "How long should your story be?",
          "order": 2,
          "sectionId": "story-style",
          "agentId": "agent_01jw9ncb1mfzraeyqv480qac24" // Update from "length-agent"
        }
      ]
    },
    {
      "id": "story-world",
      "title": "Design Your Story World",
      "order": 2,
      "steps": [
        {
          "id": "world-type",
          "title": "Magic or Real World?",
          "order": 3,
          "sectionId": "story-world",
          "agentId": "agent_01jw9pbc55fb4twdec9j9e0hjz" // Update from "world-agent"
        }
        // Update all other agent IDs similarly...
      ]
    }
  ]
}
```

### 2. Update Message Types for Agent Communication

Enhance the userProgress types to support message history with agents:

```typescript
// In src/types/userProgress.ts
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: {
    transcribed?: boolean;
    captured?: boolean;
    agentId?: string;
  };
}

export interface ConversationResult {
  stepId: string;
  agentId: string;
  capturedData?: CapturedData[];
  completed: boolean;
  messages: Message[];
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

### 3. Add Agent Integration Service

Create a new service for handling agent interactions:

```typescript
// src/services/agentService.ts
import { Message, CapturedData } from "../types/userProgress";

interface AgentResponse {
  message: Message;
  capturedData?: CapturedData[];
  isStepComplete?: boolean;
}

export const agentService = {
  // Get the current agent for the step
  getAgentForStep: (stepId: string): string | null => {
    const workflow = workflowService.getWorkflow();
    if (!workflow) return null;

    for (const section of workflow.sections) {
      for (const step of section.steps) {
        if (step.id === stepId) {
          return step.agentId;
        }
      }
    }

    return null;
  },

  // Initialize a conversation with an agent
  initializeConversation: async (
    agentId: string,
    stepId: string
  ): Promise<Message> => {
    // This would connect to the agent API in a real implementation
    // For now, create a simulated welcome message
    return {
      id: `system_${Date.now()}`,
      role: "assistant",
      content: `Hello! I'm your guide for this step. Let's talk about ${getStepTitle(
        stepId
      )}.`,
      timestamp: new Date(),
      metadata: {
        agentId,
      },
    };
  },

  // Send a message to the agent and get a response
  sendMessageToAgent: async (
    agentId: string,
    stepId: string,
    message: string,
    history: Message[]
  ): Promise<AgentResponse> => {
    // In a real implementation, this would make an API call to the agent
    // For this implementation, simulate a response

    console.log(`Sending message to agent ${agentId} for step ${stepId}`);

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo purposes, capture data if the message contains certain keywords
    let capturedData: CapturedData[] | undefined;
    let isStepComplete = false;

    if (message.toLowerCase().includes("fantasy")) {
      capturedData = [
        {
          label: "Favorite Genre",
          value: "Fantasy",
          timestamp: new Date(),
        },
      ];
    }

    if (message.toLowerCase().includes("complete")) {
      isStepComplete = true;
    }

    return {
      message: {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: `I understand your preference. Thanks for sharing that information.`,
        timestamp: new Date(),
        metadata: {
          agentId,
        },
      },
      capturedData,
      isStepComplete,
    };
  },
};

// Helper function to get step title
function getStepTitle(stepId: string): string {
  const workflow = workflowService.getWorkflow();
  if (!workflow) return "";

  for (const section of workflow.sections) {
    for (const step of section.steps) {
      if (step.id === stepId) {
        return step.title;
      }
    }
  }

  return "";
}
```

### 4. Enhance ChatInterface for Agent Communication

Update the ChatInterface component to communicate with agents:

```typescript
// In src/components/ChatInterface.tsx
import { agentService } from "../services/agentService";

// Add these hooks and functions
const [currentAgentId, setCurrentAgentId] = React.useState<string | null>(null);

// Initialize agent when step changes
React.useEffect(() => {
  const initializeAgent = async () => {
    if (!progress || !progress.currentStepId) return;

    const agentId = agentService.getAgentForStep(progress.currentStepId);
    if (!agentId) {
      console.error(`No agent found for step ${progress.currentStepId}`);
      return;
    }

    setCurrentAgentId(agentId);

    // If we already have messages, don't initialize again
    const currentStepProgress = progress.stepProgress[progress.currentStepId];
    if (
      currentStepProgress?.messages &&
      currentStepProgress.messages.length > 0
    ) {
      setMessages(currentStepProgress.messages);
      return;
    }

    // Initialize conversation
    try {
      const initialMessage = await agentService.initializeConversation(
        agentId,
        progress.currentStepId
      );
      setMessages([initialMessage]);

      // Update progress with initial message
      if (onProgressUpdate) {
        const updatedProgress = progressService.addMessage(
          progress,
          progress.currentStepId,
          initialMessage
        );
        onProgressUpdate(updatedProgress);
      }
    } catch (error) {
      console.error("Failed to initialize agent conversation:", error);
    }
  };

  initializeAgent();
}, [progress.currentStepId]);

// Add function to handle sending messages to agent
const sendMessageToAgent = React.useCallback(
  async (message: string) => {
    if (!progress || !progress.currentStepId || !currentAgentId) return;

    // Create user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    // Update UI with user message
    setMessages((prev) => [...prev, userMessage]);

    // Update progress with user message
    let updatedProgress = progressService.addMessage(
      progress,
      progress.currentStepId,
      userMessage
    );
    if (onProgressUpdate) {
      onProgressUpdate(updatedProgress);
    }

    try {
      // Send message to agent
      const agentResponse = await agentService.sendMessageToAgent(
        currentAgentId,
        progress.currentStepId,
        message,
        updatedProgress.stepProgress[progress.currentStepId]?.messages || []
      );

      // Update UI with agent response
      setMessages((prev) => [...prev, agentResponse.message]);

      // Update progress with agent response
      updatedProgress = progressService.addMessage(
        updatedProgress,
        progress.currentStepId,
        agentResponse.message
      );

      // If agent provided captured data, add it to the progress
      if (agentResponse.capturedData && agentResponse.capturedData.length > 0) {
        updatedProgress = progressService.addCapturedData(
          updatedProgress,
          progress.currentStepId,
          agentResponse.capturedData
        );
      }

      // If agent signals step completion, call onCompleteStep
      if (agentResponse.isStepComplete) {
        onCompleteStep(agentResponse.capturedData);
      }

      // Update progress
      if (onProgressUpdate) {
        onProgressUpdate(updatedProgress);
      }
    } catch (error) {
      console.error("Failed to get agent response:", error);
    }
  },
  [
    progress,
    progress.currentStepId,
    currentAgentId,
    onProgressUpdate,
    onCompleteStep,
  ]
);
```

### 5. Add Voice Recognition Integration

Enhance the ChatInterface with voice recognition capabilities:

```typescript
// In src/components/ChatInterface.tsx

// Add speech recognition state
const [recognition, setRecognition] = React.useState<any>(null);
const [transcript, setTranscript] = React.useState<string>("");

// Initialize speech recognition
React.useEffect(() => {
  // Check if browser supports speech recognition
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;

    recognitionInstance.onresult = (event: any) => {
      const currentTranscript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("");

      setTranscript(currentTranscript);
    };

    recognitionInstance.onend = () => {
      if (isListening) {
        // Restart recognition if it ended but we want to keep listening
        recognitionInstance.start();
      }
    };

    setRecognition(recognitionInstance);
  }
}, []);

// Update toggleListening function
const toggleListening = React.useCallback(() => {
  if (!recognition) return;

  if (isListening) {
    // Stop listening
    recognition.stop();
    setIsListening(false);

    // If we have a transcript, send it to the agent
    if (transcript.trim()) {
      sendMessageToAgent(transcript.trim());
      setTranscript("");
    }
  } else {
    // Start listening
    try {
      recognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
    }
  }
}, [isListening, recognition, transcript, sendMessageToAgent]);
```

## Testing

After implementation, test the following:

1. Agent initialization when a step becomes active
2. Message history persistence across page reloads
3. Voice recognition (if browser supports it)
4. Data capturing based on user responses
5. Step completion detection

## Notes

- For a full implementation, replace the mock agent service with real API calls
- Voice recognition requires HTTPS in production environments
- Consider adding fallback text input for browsers that don't support speech recognition
