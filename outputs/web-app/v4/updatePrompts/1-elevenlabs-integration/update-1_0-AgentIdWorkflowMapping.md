# Update - Agent ID Workflow Mapping

## How to Use This Document

This document provides a comprehensive guide for updating agentId properties in workflow.json to match corresponding ElevenLabs agent configurations.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-AgentIdWorkflowMapping.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `src/data/workflow.json`
- `CharacterCreationQuizPromptFlow.json`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

Update the `agentId` properties in `src/data/workflow.json` to match the corresponding `elevenlabs_config.agent_id` values from `CharacterCreationQuizPromptFlow.json`.

---

## Implementation Steps

### 1. Extract Agent IDs from Source File

**Instructions:**

1. Read the `CharacterCreationQuizPromptFlow.json` file to extract the `elevenlabs_config.agent_id` values for each node
2. Create a mapping of workflow steps to their corresponding agent IDs
3. Document the relationship between step names/descriptions and node configurations

**Key Data Points:**

- Source file: `CharacterCreationQuizPromptFlow.json`
- Target property: `elevenlabs_config.agent_id` in each node
- Reference property: `name` property in each node's `prompt_config`

### 2. Map Workflow Steps to Agent IDs

**Instructions:**

1. Open `src/data/workflow.json` and identify all workflow steps that require agent IDs
2. Map each workflow step to its corresponding node in the CharacterCreationQuizPromptFlow.json based on:
   - Step names/descriptions
   - Functional similarity
   - Workflow sequence alignment

### 3. Update Agent ID Fields

**Instructions:**

1. For each step in workflow.json, update the `agentId` field with the corresponding `elevenlabs_config.agent_id` value
2. Ensure all agent IDs are extracted from the JSON file (do not use hardcoded values)
3. Maintain the existing workflow structure while only updating the agent ID values

---

## Files to Modify

- `/src/data/workflow.json` - Update `agentId` fields for each workflow step

## Reference Sources

- `/CharacterCreationQuizPromptFlow.json` - Contains the correct agent IDs in the `elevenlabs_config.agent_id` property of each node

---

## Validation Steps

After implementation:

1. Verify all workflow steps have valid agent IDs
2. Confirm agent IDs match the format and values from the source file
3. Test that the workflow maintains its existing structure and functionality
4. Ensure no hardcoded values were used in the update process

---

## Notes

- **Do not use hardcoded values**: Always extract the actual `elevenlabs_config.agent_id` values from the JSON file during execution
- **Preserve workflow structure**: Only update agent ID values, do not modify other workflow properties
- **Maintain consistency**: Ensure the mapping logic is consistent and reproducible
