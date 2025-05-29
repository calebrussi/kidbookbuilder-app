# Todo App with Chat Interface - Requirements

## Project Overview

Build a React web application that mimics a ToDo app but uses a chat interface to complete tasks. This is a UI-only implementation with state management but no backend functionality.

## Technical Requirements

- **Framework**: React with TypeScript
- **Styling**: TailwindCSS
- **Responsive**: Mobile-first design
- **State Management**: React hooks (useState, useEffect)
- **No Backend**: Static UI only, no API calls or persistent data

## Core Features

### Step Management System

Create a workflow component that displays an ordered list of steps. Each step has:

#### Step States

- `not_started` - Initial state (gray/inactive appearance)
- `in_progress` - Currently active step (highlighted/emphasized)
- `started` - Previously worked on but incomplete (partial progress indicator)
- `complete` - Finished step (checkmark/green indicator)
- `error` - Technical error state (red/warning indicator)

#### Step Interaction Rules

- Only one step can be `in_progress` at a time
- Users can click to activate any previous step (reactivate `started` or `complete` steps)
- Users cannot skip ahead to future `not_started` steps
- Clicking an active step keeps it active

### UI Components Needed

#### 1. Workflow Header

- Display workflow title (e.g., "Character Creation Quiz")
- Progress indicator showing current step position

#### 2. Step List Component

- Vertical list of all steps grouped by section
- Each step shows:
  - Step title
  - Current state (visual indicator)
  - Click handler for activation

#### 3. Chat Interface Area

- Placeholder for voice chat interface
- No actual chat functionality needed
- Visual indication that interaction happens via voice

## Data Requirements

### Workflow Data Structure

The workflow data must persist the complete structure of the quiz workflow, including sections and steps. This data should be stored in a format that can be easily loaded and modified.

```typescript
interface WorkflowStep {
  id: string;
  title: string;
  order: number;
  sectionId: string;
  agentId: string;
}

interface WorkflowSection {
  id: string;
  title: string;
  order: number;
  steps: WorkflowStep[];
}

interface Workflow {
  id: string;
  title: string;
  description?: string;
  sections: WorkflowSection[];
  createdAt: Date;
  updatedAt: Date;
}
```

### User Progress Data Structure

The user progress data must track the current state of each step and overall session progress. This data should persist across browser sessions.

```typescript
type StepStatus =
  | "not_started"
  | "in_progress"
  | "started"
  | "complete"
  | "error";

interface StepProgress {
  stepId: string;
  status: StepStatus;
  conversationId: string;
  startedAt?: Date;
  completedAt?: Date;
  lastModified: Date;
  attemptCount: number;
  userInputs?: Record<string, any>; // Store any user responses/inputs
}

interface UserProgress {
  userId?: string; // Optional for anonymous users
  workflowId: string;
  sessionId: string;
  currentStepId: string;
  stepProgress: Record<string, StepProgress>; // stepId -> progress
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
```

### Storage Requirements

#### Local Storage Schema

For browser-based persistence without backend:

```typescript
interface LocalStorageSchema {
  userProgress: Record<string, UserProgress>; // sessionId -> progress
  currentSession: {
    sessionId: string;
    workflowId: string;
  };
}
```

#### Data Persistence Strategy

- **Workflow Data**: Loaded from a static JSON file at application startup
- **User Progress**: Stored in localStorage with automatic backup/restore
- **Session Management**: Generate unique session IDs for tracking progress
- **Data Validation**: Validate data integrity on load and save operations

## Sample Data Structure

### Workflow: "Character Creation Quiz"

#### Section 1: "Tell Me Your Story Style"

- "What stories do you love?" (favorite genres and themes)
- "How long should your story be?" (short stories, chapter books)

#### Section 2: "Design Your Story World"

- "Magic or Real World?" (choose your world type)
- "Pick Your Setting" (kingdoms, space, underwater, etc.)
- "When Does It Happen?" (past, present, future)
- "Weather & Places" (environment details)

## Design Requirements

### Visual Design

- Clean, modern interface suitable for children and adults
- Bright, engaging colors
- Clear visual hierarchy
- Accessible design (good contrast, readable fonts)

### Mobile Responsiveness

- Touch-friendly interface
- Optimized for mobile screens
- Responsive layout that works on tablets and phones

### State Visual Indicators

- **Not Started**: Light gray background, muted text
- **In Progress**: Bright accent color, bold text, possible animation
- **Started**: Partial progress bar or indicator
- **Complete**: Green checkmark, satisfied state
- **Error**: Red warning icon, error styling

## File Structure Suggestion

```
src/
  components/
    WorkflowHeader.tsx
    StepList.tsx
    StepItem.tsx
    ChatInterface.tsx
  types/
    workflow.ts
    userProgress.ts
    storage.ts
  data/
    workflow.json
    sampleProgress.ts
  services/
    storageService.ts
    progressService.ts
    workflowService.ts
  hooks/
    useWorkflow.ts
    useProgress.ts
    useLocalStorage.ts
  App.tsx
```

## Implementation Notes

- Use TypeScript interfaces for step and workflow data structures
- Implement state management with React hooks
- Focus on component reusability
- Include proper TypeScript typing
- Add hover states and smooth transitions
- Ensure keyboard accessibility even though primary interaction is via voice

### Data Management Requirements

- **Workflow Loading**: Load workflow from JSON file on application startup
- **State Persistence**: Implement localStorage for user progress and session data
- **Data Validation**: Add schema validation for all data structures
- **Error Handling**: Handle cases where localStorage is unavailable or corrupted

### Custom Hooks for Data Management

- `useWorkflow`: Manages workflow data loading from JSON file and caching
- `useProgress`: Manages user progress state and persistence
- `useLocalStorage`: Generic hook for localStorage operations with error handling

### Service Layer Requirements

- `storageService`: Abstract localStorage operations with fallback strategies
- `progressService`: Handle progress calculations and state transitions
- `workflowService`: Load and validate workflow data from JSON file

# Chat Implementation Details

- At the completion of each step, one to four data elements are captured and should be displayed. The data isn't editable by the user. it would be read only.
- Complete current step button is not necessary. the chatbot will determine when a step is complete.
- Add a scrolling window of the messages from the chatbot
