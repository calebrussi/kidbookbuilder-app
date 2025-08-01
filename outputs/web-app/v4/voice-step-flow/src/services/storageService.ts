import { UserProgress } from '../types/userProgress';
import { fixProgressData } from '../utils/progressFixer';

interface LocalStorageSchema {
  userProgress: Record<string, UserProgress>;
  currentSession: {
    sessionId: string;
    workflowId: string;
  };
}

class StorageService {
  private static readonly STORAGE_KEY_PREFIX = 'character-quiz-app';

  private getStorageKey(userId?: string): string {
    return userId ? `${StorageService.STORAGE_KEY_PREFIX}-${userId}` : StorageService.STORAGE_KEY_PREFIX;
  }

  private getStorageData(userId?: string): LocalStorageSchema {
    try {
      const storageKey = this.getStorageKey(userId);
      const data = localStorage.getItem(storageKey);
      if (!data) return this.getDefaultStorageData();
      
      const parsed = JSON.parse(data);
      return {
        userProgress: parsed.userProgress || {},
        currentSession: parsed.currentSession || this.generateDefaultSession()
      };
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return this.getDefaultStorageData();
    }
  }

  private getDefaultStorageData(): LocalStorageSchema {
    return {
      userProgress: {},
      currentSession: this.generateDefaultSession()
    };
  }

  private generateDefaultSession() {
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: 'character-creation-quiz'
    };
  }

  private saveStorageData(data: LocalStorageSchema, userId?: string): void {
    try {
      const storageKey = this.getStorageKey(userId);
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getUserProgress(sessionId: string, userId?: string): UserProgress | null {
    const data = this.getStorageData(userId);
    const progress = data.userProgress[sessionId] || null;
    
    // If we have progress data, run it through the fixer to ensure all required fields exist
    return progress ? fixProgressData(progress) : null;
  }

  saveUserProgress(progress: UserProgress, userId?: string): void {
    const data = this.getStorageData(userId);
    data.userProgress[progress.sessionId] = progress;
    this.saveStorageData(data, userId);
  }

  getCurrentSession(userId?: string) {
    return this.getStorageData(userId).currentSession;
  }

  setCurrentSession(sessionId: string, workflowId: string, userId?: string): void {
    const data = this.getStorageData(userId);
    data.currentSession = { sessionId, workflowId };
    this.saveStorageData(data, userId);
  }

  clearAllData(userId?: string): void {
    try {
      const storageKey = this.getStorageKey(userId);
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

export const storageService = new StorageService();
