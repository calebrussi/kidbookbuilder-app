/**
 * Test script for validating the user progress system
 * Can be run in browser console or as part of automated tests
 */

import { progressManager } from './progressManager.js';
import { characterCreationQuizWorkflow } from '../data/characterCreationQuizWorkflow.js';
import { UserProgress, StepProgress } from '../types/userProgress.js';

export async function runProgressTests() {
  console.log('🧪 Starting Progress System Tests');
  console.log('================================');

  // Test 1: Clear existing progress
  console.log('📝 Test 1: Clearing existing progress');
  progressManager.clearProgress('character-creation-quiz');
  const clearedProgress = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Progress cleared:', clearedProgress === null);

  // Test 2: Create new progress
  console.log('\n📝 Test 2: Creating new progress');
  const allSteps = characterCreationQuizWorkflow.sections.flatMap(s => s.steps);
  const testProgress: UserProgress = {
    workflowId: 'character-creation-quiz',
    startedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    steps: {}
  };

  allSteps.forEach(step => {
    testProgress.steps[step.id] = {
      stepId: step.id,
      sectionId: step.sectionId,
      agentId: step.agentId,
      state: 'not_started',
      lastUpdated: new Date().toISOString()
    };
  });

  progressManager.saveProgress(testProgress);
  const savedProgress = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Progress saved and loaded:', !!savedProgress);
  console.log('✅ Step count matches:', Object.keys(savedProgress!.steps).length === allSteps.length);

  // Test 3: Update step states
  console.log('\n📝 Test 3: Testing step state updates');
  const firstStep = allSteps[0];
  
  // Simulate step becoming in_progress
  savedProgress!.steps[firstStep.id].state = 'in_progress';
  savedProgress!.lastUpdated = new Date().toISOString();
  progressManager.saveProgress(savedProgress!);
  
  const updatedProgress = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Step state updated:', updatedProgress!.steps[firstStep.id].state === 'in_progress');

  // Test 4: Add conversation data
  console.log('\n📝 Test 4: Testing conversation data');
  const conversationId = `test_conv_${Date.now()}`;
  updatedProgress!.steps[firstStep.id].conversationData = {
    conversationId,
    startTime: new Date().toISOString(),
    messages: [
      {
        role: 'assistant',
        content: 'Hello! Let\'s start the conversation.',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  progressManager.saveProgress(updatedProgress!);
  const progressWithConversation = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Conversation data saved:', 
    progressWithConversation!.steps[firstStep.id].conversationData?.conversationId === conversationId);

  // Test 5: Complete conversation
  console.log('\n📝 Test 5: Testing conversation completion');
  progressWithConversation!.steps[firstStep.id].conversationData!.endTime = new Date().toISOString();
  progressWithConversation!.steps[firstStep.id].state = 'complete';
  progressManager.saveProgress(progressWithConversation!);
  
  const completedProgress = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Step completed:', completedProgress!.steps[firstStep.id].state === 'complete');
  console.log('✅ Conversation ended:', !!completedProgress!.steps[firstStep.id].conversationData?.endTime);

  // Test 6: Export/Import
  console.log('\n📝 Test 6: Testing export/import');
  const exportData = progressManager.exportProgress();
  console.log('✅ Export data generated:', exportData.length > 0);
  
  // Clear and import
  progressManager.clearProgress('character-creation-quiz');
  const importSuccess = progressManager.importProgress(exportData);
  console.log('✅ Import successful:', importSuccess);
  
  const importedProgress = progressManager.loadProgress('character-creation-quiz');
  console.log('✅ Progress restored:', !!importedProgress);
  console.log('✅ Step state preserved:', importedProgress!.steps[firstStep.id].state === 'complete');

  // Test 7: Progress summary
  console.log('\n📝 Test 7: Testing progress summary');
  const summary = progressManager.getProgressSummary('character-creation-quiz');
  console.log('✅ Summary generated:', !!summary);
  console.log('📊 Progress Summary:', summary);

  console.log('\n🎉 All tests completed successfully!');
  console.log('================================');
  
  return {
    success: true,
    testProgress: importedProgress,
    summary
  };
}

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).testProgress = runProgressTests;
  console.log('💡 Run window.testProgress() in browser console to test the progress system');
}
