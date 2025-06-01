# Convert Prompt Flow to App Configuration

## Overview

Convert the `CharacterCreationQuizPromptFlow.json` configuration into a TypeScript workflow file that integrates with the existing todo-app structure.

## Prerequisites

- Review the existing workflow format in `todo-app/src/data/sampleWorkflow.ts`
- Examine the JSON configuration in `CharacterCreationQuizPromptFlow.json`
- Understand the TypeScript types in `todo-app/src/types/workflow.ts`

## Steps

### 1. Update Type Definitions

Ensure the `Step` interface in `todo-app/src/types/workflow.ts` includes the `agentId` property:

```typescript
export interface Step {
  id: string;
  title: string;
  state: StepState;
  sectionId: string;
  agentId: string; // Required for ElevenLabs agent routing
}
```

### 2. Extract Agent IDs from JSON

Use this command to extract the mapping of node names to ElevenLabs agent IDs:

```bash
jq -r '.[] | "\(.name): \(.elevenlabs_config.agent_id)"' CharacterCreationQuizPromptFlow.json
```

### 3. Create New Workflow File

Create `todo-app/src/data/characterCreationQuizWorkflow.ts` with:

- **Structure**: 4 sections corresponding to the JSON groups
- **Agent IDs**: Use actual ElevenLabs agent IDs from `elevenlabs_config.agent_id` (not descriptive names)
- **Titles**: Convert JSON descriptions to user-friendly titles
- **Dependencies**: Organize steps based on JSON group dependencies

### 4. Section Mapping

Map JSON groups to TypeScript sections:

| JSON Group | TypeScript Section       | Steps                                                                |
| ---------- | ------------------------ | -------------------------------------------------------------------- |
| group_1    | Tell Me Your Story Style | favoriteStories, storyLength                                         |
| group_2    | Design Your Story World  | worldType, setting, timePeriod, environment                          |
| group_3    | Create Your Characters   | heroPersonality, supportingCharacters, specialPowers, heroChallenges |
| group_4    | Choose Your Adventure    | questType, emotionalElements, challenges, storyOutcome               |

### 5. Update Application Integration

Update `todo-app/src/pages/Index.tsx` to import and use the new workflow:

```typescript
import { characterCreationQuizWorkflow } from "../data/characterCreationQuizWorkflow";
const [workflow, setWorkflow] = useState(characterCreationQuizWorkflow);
```

### 6. Add Debug Logging

Include console logging in step handlers for debugging:

```typescript
const handleStepClick = (clickedStep: Step) => {
  console.log("Step clicked:", {
    id: clickedStep.id,
    title: clickedStep.title,
    agentId: clickedStep.agentId,
  });
  // ...existing logic...
};
```

## Validation

- Verify TypeScript compilation succeeds
- Test application builds without errors
- Confirm agent IDs match ElevenLabs configuration
- Validate workflow progression and state management

## Expected Output

- `characterCreationQuizWorkflow.ts` with 14 steps across 4 sections
- Each step configured with proper ElevenLabs agent ID
- Application successfully using the new workflow
- Debug logging showing step configurations when clicked

## Key Points

- **Agent IDs**: Always use `elevenlabs_config.agent_id` values, not descriptive names
- **Type Safety**: Ensure all workflow data conforms to TypeScript interfaces
- **State Management**: Maintain proper step state transitions
- **Dependencies**: Respect JSON group dependencies in section organization
