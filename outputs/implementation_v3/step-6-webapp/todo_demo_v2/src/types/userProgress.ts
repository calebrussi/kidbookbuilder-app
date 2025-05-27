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
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversationResult {
  success: boolean;
  data?: any;
  error?: string;
  completedAt: Date;
  duration?: number;
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
  conversationResult?: ConversationResult;
  messages: Message[];
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
