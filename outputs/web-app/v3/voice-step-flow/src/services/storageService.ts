import { UserProgress } from '../types/userProgress';

interface LocalStorageSchema {
  userProgress: Record<string, UserProgress>;
  currentSession: {
    sessionId: string;
    workflowId: string;
  };
}

class StorageService {
  private static readonly STORAGE_KEY = 'character-quiz-app';

  private getStorageData(): LocalStorageSchema {
    try {
      const data = localStorage.getItem(StorageService.STORAGE_KEY);
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

  private saveStorageData(data: LocalStorageSchema): void {
    try {
      localStorage.setItem(StorageService.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  getUserProgress(sessionId: string): UserProgress | null {
    const data = this.getStorageData();
    return data.userProgress[sessionId] || null;
  }

  saveUserProgress(progress: UserProgress): void {
    const data = this.getStorageData();
    data.userProgress[progress.sessionId] = progress;
    this.saveStorageData(data);
  }

  getCurrentSession() {
    return this.getStorageData().currentSession;
  }

  setCurrentSession(sessionId: string, workflowId: string): void {
    const data = this.getStorageData();
    data.currentSession = { sessionId, workflowId };
    this.saveStorageData(data);
  }

  clearAllData(): void {
    try {
      localStorage.removeItem(StorageService.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
}

export const storageService = new StorageService();
