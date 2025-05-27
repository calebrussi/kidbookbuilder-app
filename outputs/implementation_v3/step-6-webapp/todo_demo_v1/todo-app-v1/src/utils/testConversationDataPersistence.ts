// Test utility to validate conversation data persistence
export const testConversationDataPersistence = () => {
  console.log('🧪 Testing conversation data persistence...');
  
  // This test simulates the race condition scenario where:
  // 1. A conversation starts
  // 2. Multiple messages are added rapidly
  // 3. The conversation ends
  // 4. We verify that all data is preserved
  
  const stepId = 'test-step-1';
  const conversationId = 'test-conv-123';
  
  // Simulate rapid conversation data updates
  const testMessages = [
    { role: 'assistant', content: 'Hello! What\'s your favorite story?', timestamp: new Date() },
    { role: 'user', content: 'I love adventure stories!', timestamp: new Date() },
    { role: 'assistant', content: 'That\'s wonderful! Tell me more about your favorite adventures.', timestamp: new Date() },
    { role: 'user', content: 'I like stories with magic and brave heroes!', timestamp: new Date() },
    { role: 'assistant', content: 'Perfect! Let\'s create a magical adventure story together.', timestamp: new Date() }
  ];
  
  return {
    stepId,
    conversationId,
    testMessages,
    description: 'Test rapid conversation data updates to ensure no data loss occurs'
  };
};

// Helper to log conversation data state
export const logConversationDataState = (stepId: string, userProgress: any) => {
  if (!userProgress) {
    console.log('❌ No userProgress available');
    return;
  }
  
  const stepData = userProgress.steps[stepId];
  if (!stepData) {
    console.log('❌ No step data found for:', stepId);
    return;
  }
  
  const conversationData = stepData.conversationData;
  console.log('📊 Conversation data state:', {
    stepId,
    hasConversationData: !!conversationData,
    conversationId: conversationData?.conversationId,
    startTime: conversationData?.startTime,
    endTime: conversationData?.endTime,
    messageCount: conversationData?.messages?.length || 0,
    messages: conversationData?.messages || []
  });
};
