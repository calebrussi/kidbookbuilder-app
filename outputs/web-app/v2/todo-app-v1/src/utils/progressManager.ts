import { UserProgress, StepProgress, ConversationData, ProgressStorageManager } from '../types/userProgress';
import { StepState } from '../types/workflow';

const STORAGE_KEY_PREFIX = 'workflow_progress_';
const SESSION_KEY = 'session_id';

class LocalProgressManager implements ProgressStorageManager {
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionId(): string {
    let sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  private getStorageKey(workflowId: string): string {
    return `${STORAGE_KEY_PREFIX}${workflowId}`;
  }

  saveProgress(progress: UserProgress): void {
    try {
      const storageKey = this.getStorageKey(progress.workflowId);
      const progressData = {
        ...progress,
        lastUpdated: new Date().toISOString(),
        metadata: {
          ...progress.metadata,
          sessionId: this.getSessionId(),
          userAgent: navigator.userAgent,
          deviceInfo: `${navigator.platform} - ${navigator.language}`
        }
      };
      
      localStorage.setItem(storageKey, JSON.stringify(progressData));
      console.log('💾 Progress saved:', {
        workflowId: progress.workflowId,
        stepCount: Object.keys(progress.steps).length,
        lastUpdated: progressData.lastUpdated
      });
    } catch (error) {
      console.error('❌ Failed to save progress:', error);
    }
  }

  loadProgress(workflowId: string): UserProgress | null {
    try {
      const storageKey = this.getStorageKey(workflowId);
      const progressData = localStorage.getItem(storageKey);
      
      if (!progressData) {
        console.log('📝 No existing progress found for workflow:', workflowId);
        return null;
      }

      const progress = JSON.parse(progressData) as UserProgress;
      console.log('📖 Progress loaded:', {
        workflowId: progress.workflowId,
        stepCount: Object.keys(progress.steps).length,
        lastUpdated: progress.lastUpdated
      });
      
      return progress;
    } catch (error) {
      console.error('❌ Failed to load progress:', error);
      return null;
    }
  }

  updateStepProgress(stepId: string, stepProgress: Partial<StepProgress>): void {
    // This method needs a workflow context, so it will be called from the hook
    console.log('🔄 Step progress update requested:', { stepId, stepProgress });
  }

  clearProgress(workflowId: string): void {
    try {
      const storageKey = this.getStorageKey(workflowId);
      localStorage.removeItem(storageKey);
      console.log('🗑️ Progress cleared for workflow:', workflowId);
    } catch (error) {
      console.error('❌ Failed to clear progress:', error);
    }
  }

  exportProgress(): string {
    try {
      const allProgress: Record<string, UserProgress> = {};
      
      // Get all workflow progress from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
          const workflowId = key.replace(STORAGE_KEY_PREFIX, '');
          const progressData = localStorage.getItem(key);
          if (progressData) {
            allProgress[workflowId] = JSON.parse(progressData);
          }
        }
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        sessionId: this.getSessionId(),
        progress: allProgress
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Failed to export progress:', error);
      return '';
    }
  }

  importProgress(progressData: string): boolean {
    try {
      const importData = JSON.parse(progressData);
      
      if (!importData.progress) {
        console.error('❌ Invalid progress data format');
        return false;
      }

      // Import all workflows
      Object.entries(importData.progress).forEach(([workflowId, progress]) => {
        this.saveProgress(progress as UserProgress);
      });

      console.log('✅ Progress imported successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to import progress:', error);
      return false;
    }
  }

  // Additional utility methods
  getAllProgressKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keys.push(key.replace(STORAGE_KEY_PREFIX, ''));
      }
    }
    return keys;
  }

  getProgressSummary(workflowId: string): {
    totalSteps: number;
    completedSteps: number;
    inProgressSteps: number;
    lastActivity: string;
  } | null {
    const progress = this.loadProgress(workflowId);
    if (!progress) return null;

    const steps = Object.values(progress.steps);
    return {
      totalSteps: steps.length,
      completedSteps: steps.filter(s => s.state === 'complete').length,
      inProgressSteps: steps.filter(s => s.state === 'in_progress').length,
      lastActivity: progress.lastUpdated
    };
  }
}

export const progressManager = new LocalProgressManager();
