# Update - VoiceStepFlowSourceUpdate

## How to Use This Document
This document provides a comprehensive guide for applying the changes from the original `src-original` folder to the updated `src` folder in the `voice-step-flow` feature.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-VoiceStepFlowSourceUpdate.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src-original/**`
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/**`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

Identify and apply all code changes made between the original `src-original` folder and the updated `src` folder for the `voice-step-flow` feature, ensuring the codebase reflects the updated implementation.

---

## Implementation Steps

### 1. Compare Directory Structures

**Instructions:**

1. Review the contents of both `src-original` and `src` directories.
2. Generate a diff report to identify added, modified, and removed files (e.g., using `diff -ru`).
3. Document each file-level and code-level change.

**Key Data Points:**

- Original path: `/outputs/web-app/v4/voice-step-flow/src-original`
- Updated path: `/outputs/web-app/v4/voice-step-flow/src`

### 2. Apply Code Changes

**Instructions:**

1. For each changed file, manually apply insertions, deletions, and updates to the corresponding file in your working branch.
2. Ensure code formatting and linting rules are respected.
3. Update import paths if directory structures have changed.

**Key Data Points:**

- Preserve original functionality not affected by updates.
- Align with project ESLint and Prettier configurations.

### 3. Verify Feature Functionality

**Instructions:**

1. Run existing unit and integration tests for `voice-step-flow`.
2. Manually test the voice step flow in the web-app UI.
3. Address any regressions or new issues.

**Key Data Points:**

- Test commands: `npm test`, `npm run test:voice-step-flow`.
- Manual test steps: Navigate to the voice step implementation in the browser.

---

## Files to Modify

- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/VoiceStepFlow.tsx` - Apply updated component logic and UI adjustments
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/utils/voiceHelpers.ts` - Incorporate helper function changes
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/hooks/useVoiceStep.ts` - Update hook implementation as per new behavior
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/styles/VoiceStepFlow.module.css` - Update CSS class names and styles if applicable

## Reference Sources

- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src-original/VoiceStepFlow.tsx` - Original component implementation
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src-original/utils/voiceHelpers.ts` - Original helper functions

---

## Validation Steps

After implementation:

1. Ensure all diffed changes have been applied without omissions.
2. Run `npm run lint` and confirm no lint errors.
3. Execute the full test suite with `npm test` ensuring all tests pass.
4. Perform a manual UI review of the voice step flow to confirm expected behavior.

---

## Notes

- **Consistency:** Maintain code style consistent with the project’s ESLint and Prettier settings.
- **Imports:** Align relative import paths after updating files.
- **Dependencies:** Verify any new dependencies introduced in `src` are declared in `package.json`.
