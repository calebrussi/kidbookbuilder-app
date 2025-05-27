/**
 * Browser-based test script for validating the user progress system
 * Can be run in browser console by opening dev tools and calling window.testProgress()
 */

import { progressManager } from './progressManager';
import { characterCreationQuizWorkflow } from '../data/characterCreationQuizWorkflow';
import { UserProgress, StepProgress } from '../types/userProgress';

// Test function for browser console
export function testProgress() {
  console.log('🧪 Starting Progress System Tests in Browser');
  
  try {
    // Test 1: Initial progress creation
    console.log('\n📝 Test 1: Initial Progress Creation');
    const initialProgress = progressManager.getProgress();
    console.log('Initial progress:', initialProgress);
    
    // Test 2: Update step state
    console.log('\n📝 Test 2: Update Step State');
    progressManager.updateStepState('favorite-stories', 'in_progress');
    const updatedProgress = progressManager.getProgress();
    console.log('After updating step state:', updatedProgress?.steps['favorite-stories']);
    
    // Test 3: Start conversation
    console.log('\n📝 Test 3: Start Conversation');
    const conversationId = progressManager.startConversation('favorite-stories', 'agent_01jw7a67zjffp9xcm3c4ed1g5g');
    console.log('Started conversation:', conversationId);
    
    // Test 4: Add conversation message
    console.log('\n📝 Test 4: Add Conversation Message');
    progressManager.updateConversationData('favorite-stories', conversationId, {
      messages: [
        {
          id: 'msg-1',
          role: 'assistant',
          content: 'Hello! What stories do you love?',
          timestamp: new Date()
        }
      ]
    });
    
    const progressWithMessage = progressManager.getProgress();
    console.log('After adding message:', progressWithMessage?.conversations['favorite-stories']);
    
    // Test 5: Complete step
    console.log('\n📝 Test 5: Complete Step');
    progressManager.endConversation('favorite-stories', conversationId);
    progressManager.updateStepState('favorite-stories', 'complete');
    
    const finalProgress = progressManager.getProgress();
    console.log('Final progress:', finalProgress?.steps['favorite-stories']);
    
    // Test 6: Export/Import
    console.log('\n📝 Test 6: Export/Import');
    const exported = progressManager.exportProgress();
    console.log('Exported data length:', JSON.stringify(exported).length);
    
    // Clear and import
    localStorage.removeItem('user-progress');
    progressManager.importProgress(exported);
    const importedProgress = progressManager.getProgress();
    console.log('Imported progress matches:', 
      JSON.stringify(finalProgress) === JSON.stringify(importedProgress)
    );
    
    console.log('\n✅ All tests completed successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Make it available globally for browser console
declare global {
  interface Window {
    testProgress: () => boolean;
  }
}

if (typeof window !== 'undefined') {
  window.testProgress = testProgress;
}
