export type StepStatus =
  | "not_started"
  | "in_progress"
  | "started"
  | "complete"
  | "error";

export interface CapturedData {
  label: string;
  value: string;
  timestamp: Date;
}

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
  messages: Message[]; // Array to store conversation messages
  analysis?: any[]; // Analysis data from conversation API
  success?: boolean; // Whether the conversation was successful
  conversationStatus?: string; // Status of the conversation
}

export interface UserProgress {
  userId?: string;
  workflowId: string;
  sessionId: string;
  currentStepId: string;
  stepProgress: Record<string, StepProgress>;
  overallProgress: {
    totalSteps: number;
    completedSteps: number;
    percentComplete: number;
  };
  sessionData: {
    startedAt: Date;
    lastActivityAt: Date;
    timeSpentMinutes: number;
  };
}
