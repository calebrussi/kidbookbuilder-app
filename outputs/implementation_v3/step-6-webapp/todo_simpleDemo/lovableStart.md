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

#### Section 3: "Create Your Characters"

- "Your Hero's Personality" (traits and qualities)
- "Friends & Family" (supporting characters)
- "Special Powers" (abilities and skills)
- "Hero's Challenges" (fears and obstacles)

#### Section 4: "Choose Your Adventure"

- "Type of Quest" (mystery, discovery, journey)
- "Friendship & Feelings" (emotional elements)
- "Challenges to Face" (puzzles, battles, problems)
- "How It Ends" (story outcome)

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
  data/
    sampleWorkflow.ts
  App.tsx
```

## Implementation Notes

- Use TypeScript interfaces for step and workflow data structures
- Implement state management with React hooks
- Focus on component reusability
- Include proper TypeScript typing
- Add hover states and smooth transitions
- Ensure keyboard accessibility even though primary interaction is via voice
