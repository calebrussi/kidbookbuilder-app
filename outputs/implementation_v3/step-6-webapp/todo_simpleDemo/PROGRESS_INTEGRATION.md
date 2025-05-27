# User Progress System Integration Guide

## Overview

The user progress system provides a complete separation between workflow definitions and user progress tracking. This allows for persistent progress storage, conversation tracking, and ElevenLabs data collection while keeping the original workflow immutable.

## Key Components

### 1. Type Definitions (`src/types/userProgress.ts`)

- **`UserProgress`**: Main progress container with metadata and step tracking
- **`StepProgress`**: Individual step progress with state and conversation data
- **`ConversationData`**: ElevenLabs conversation tracking with messages and audio segments

### 2. Progress Manager (`src/utils/progressManager.ts`)

- **Local Storage**: Client-side persistence using localStorage
- **Session Tracking**: Automatic session ID generation and device fingerprinting
- **Export/Import**: Complete progress backup and restore functionality

### 3. React Hook (`src/hooks/useUserProgress.ts`)

- **State Management**: Reactive progress state with automatic persistence
- **Conversation Tracking**: Integration with ElevenLabs conversation lifecycle
- **Step Transitions**: Automated step state management

### 4. Progress Validation (`src/utils/progressValidation.ts`)

- **Data Integrity**: Validates progress against workflow definition
- **Error Detection**: Identifies mismatched agent IDs, section IDs, and step states
- **Debug Logging**: Comprehensive progress reporting

## Integration Flow

### Initial Load

1. `useUserProgress` hook loads existing progress from localStorage
2. If no progress exists, creates new progress with all steps as 'not_started'
3. Progress is validated against workflow definition
4. Index.tsx receives reactive step states

### Step Interaction

1. User clicks on a step in StepList
2. Index.tsx calls `updateStepState` to set step to 'in_progress'
3. Progress hook updates localStorage and triggers re-render
4. ChatInterface receives updated agent ID and step ID

### Conversation Lifecycle

1. User clicks "Start Voice Chat" in ChatInterface
2. ElevenLabs websocket connects
3. `onConversationStart` called with generated conversation ID
4. Progress hook saves conversation start time and ID
5. Messages are tracked in real-time
6. On websocket disconnect, conversation end time is saved
7. Step is automatically marked as 'complete'

### Data Persistence

- **Automatic**: All progress changes are immediately saved to localStorage
- **Session Tracking**: Each browser session gets a unique ID
- **Metadata**: Device info, user agent, and timestamps are captured
- **Export/Import**: Users can backup and restore their progress

## Testing the Integration

### Console Debugging

The system provides extensive console logging:

```javascript
// Progress initialization
🔄 Initializing user progress for workflow: character-creation-quiz
📝 Created new progress: { workflowId, stepCount, firstStepState }

// Step state changes
🎯 Step clicked: { id, title, currentState, sectionId, agentId }
🚀 Setting step to in_progress: stepId
🔄 Updating step state: { stepId, oldState, newState, timestamp }

// Conversation tracking
🎙️ Conversation started: { stepId, conversationId }
💬 Message received: message
✅ Completing step: { id, title, agentId }

// Progress validation
📊 Progress Validation Report:
================================
✅ Valid: true
📈 Summary: { totalSteps, trackedSteps, completedSteps, inProgressSteps, notStartedSteps }
```

### Manual Testing Steps

1. **Initial Load**

   - Open application
   - Check console for progress initialization
   - Verify first step is 'not_started'
   - Check Progress Status panel shows correct info

2. **Step Selection**

   - Click on first step
   - Verify it changes to 'in_progress'
   - Check console logs for state change
   - Verify ChatInterface shows agent ID

3. **Conversation Flow**

   - Click "Start Voice Chat" (requires ElevenLabs API key)
   - Check console for conversation start logging
   - Simulate conversation end (close websocket)
   - Verify step automatically marks as 'complete'

4. **Progress Persistence**

   - Make several step changes
   - Refresh the page
   - Verify progress is restored correctly
   - Check localStorage for saved data

5. **Validation**
   - Check console for validation reports
   - Verify no errors or warnings
   - Test with multiple steps in different states

### Browser Developer Tools

**localStorage Inspection:**

```javascript
// View current progress
console.log(
  JSON.parse(localStorage.getItem("workflow_progress_character-creation-quiz"))
);

// Clear progress for testing
localStorage.removeItem("workflow_progress_character-creation-quiz");
```

**Progress Export:**

```javascript
// Export all progress
const exportData = progressManager.exportProgress();
console.log(exportData);
```

## Error Handling

### Common Issues

1. **Type Mismatches**: Ensure StepState values match between workflow and progress
2. **Missing Agent IDs**: Verify all workflow steps have valid agentId properties
3. **localStorage Errors**: Handle quota exceeded or disabled localStorage
4. **Conversation Tracking**: Ensure conversation IDs are properly generated and tracked

### Debug Mode

Enable additional logging by setting:

```javascript
window.DEBUG_PROGRESS = true;
```

## Configuration

### Environment Variables

```bash
VITE_ELEVENLABS_API_KEY=your_api_key_here
```

### Workflow Requirements

- All steps must have unique IDs
- All steps must have valid agentId properties
- Section IDs must be consistent
- StepState values must match type definition

## Performance Considerations

- **localStorage Limits**: Progress data is compact but consider cleanup for large datasets
- **Re-renders**: Progress changes trigger minimal re-renders via React.useMemo
- **Memory Usage**: Conversation data includes message history - consider cleanup
- **Network**: ElevenLabs conversations use WebSocket - handle connection states

## Future Enhancements

1. **Cloud Sync**: Extend to support cloud-based progress storage
2. **Multi-Device**: Sync progress across multiple devices
3. **Analytics**: Track completion rates and conversation metrics
4. **Offline Support**: Queue progress changes when offline
5. **Progress Sharing**: Export/import between users or sessions
