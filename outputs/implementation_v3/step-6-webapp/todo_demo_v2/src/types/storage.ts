
import { UserProgress } from './userProgress';

export interface LocalStorageSchema {
  userProgress: Record<string, UserProgress>;
  currentSession: {
    sessionId: string;
    workflowId: string;
  };
}
