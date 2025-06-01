import { StepState } from './workflow';

export interface ConversationData {
  conversationId?: string;
  startTime?: string;
  endTime?: string;
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  // ElevenLabs specific data collection
  audioSegments?: Array<{
    id: string;
    duration: number;
    timestamp: string;
  }>;
  userResponses?: Array<{
    question: string;
    response: string;
    timestamp: string;
  }>;
}

export interface StepProgress {
  stepId: string;
  sectionId: string;
  agentId: string;
  state: StepState;
  conversationData?: ConversationData;
  lastUpdated: string;
}

export interface UserProgress {
  userId?: string;
  workflowId: string;
  startedAt: string;
  lastUpdated: string;
  steps: Record<string, StepProgress>; // stepId -> StepProgress
  metadata?: {
    deviceInfo?: string;
    userAgent?: string;
    sessionId?: string;
  };
}

export interface ProgressStorageManager {
  saveProgress: (progress: UserProgress) => void;
  loadProgress: (workflowId: string) => UserProgress | null;
  updateStepProgress: (stepId: string, stepProgress: Partial<StepProgress>) => void;
  clearProgress: (workflowId: string) => void;
  exportProgress: () => string;
  importProgress: (progressData: string) => boolean;
}
