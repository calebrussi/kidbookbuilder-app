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

// Results of a data collection item
export interface DataCollectionResult {
  data_collection_id: string;
  value: string;
  json_schema: any;
  rationale: string;
}

// Results of an evaluation criterion
export interface EvaluationCriteriaResult {
  criteria_id: string;
  result: string;
  rationale: string;
}

// Full analysis structure returned from conversation API
export interface Analysis {
  evaluation_criteria_results: Record<string, EvaluationCriteriaResult>;
  data_collection_results: Record<string, DataCollectionResult>;
  call_successful: string;
  transcript_summary: string;
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
  analysis?: Analysis; // Analysis data from conversation API
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
