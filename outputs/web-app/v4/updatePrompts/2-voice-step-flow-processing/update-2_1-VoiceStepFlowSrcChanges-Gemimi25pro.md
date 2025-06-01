# Update - VoiceStepFlowSrcChanges

## How to Use This Document

This document provides a comprehensive guide for identifying and applying the changes between the `outputs/web-app/v4/voice-step-flow/src-snapshot-1` and `outputs/web-app/v4/voice-step-flow/src` directories.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-VoiceStepFlowSrcChanges.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- **New files to be created (from `outputs/web-app/v4/voice-step-flow/src`):**
  - `outputs/web-app/v4/voice-step-flow/src/context/debugContext.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/hooks/useProcessing.ts`
  - `outputs/web-app/v4/voice-step-flow/src/services/processingService.ts`
  - `outputs/web-app/v4/voice-step-flow/src/utils/progressFixer.ts`
- **Modified files (from `outputs/web-app/v4/voice-step-flow/src-snapshot-1` - the old version for reference):**
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/App.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/components/ChatInterface.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/components/StepItem.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/components/StepList.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/components/WorkflowHeader.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/hooks/useProgress.ts`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/pages/Index.tsx`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/services/progressService.ts`
  - `outputs/web-app/v4/voice-step-flow/src-snapshot-1/services/storageService.ts`
- **Modified files (from `outputs/web-app/v4/voice-step-flow/src` - the new version to apply):**
  - `outputs/web-app/v4/voice-step-flow/src/App.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/components/ChatInterface.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/components/StepItem.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/components/StepList.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/components/WorkflowHeader.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/hooks/useProgress.ts`
  - `outputs/web-app/v4/voice-step-flow/src/pages/Index.tsx`
  - `outputs/web-app/v4/voice-step-flow/src/services/progressService.ts`
  - `outputs/web-app/v4/voice-step-flow/src/services/storageService.ts`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

This update aims to synchronize a target directory with the changes introduced in `outputs/web-app/v4/voice-step-flow/src` based on the previous state captured in `outputs/web-app/v4/voice-step-flow/src-snapshot-1`. This involves:

- Identifying new files and directories.
- Identifying deleted files and directories.
- Identifying modified files.
- Applying these changes to a target codebase.

---

## Implementation Steps

### 1. Initial Directory Comparison (Completed)

**Instructions:**

1.  List the contents of `outputs/web-app/v4/voice-step-flow/src`.
2.  List the contents of `outputs/web-app/v4/voice-step-flow/src-snapshot-1`.
3.  Identify top-level differences.

**Key Data Points:**

- **New in `src`**: `context/`, `utils/`
- **Potentially Modified/Deleted**: Files and subdirectories within common top-level items.

### 2. Detailed Directory Diff

**Instructions:**

1.  Recursively list all files and subdirectories for `outputs/web-app/v4/voice-step-flow/src`.
2.  Recursively list all files and subdirectories for `outputs/web-app/v4/voice-step-flow/src-snapshot-1`.
3.  Compare these two lists to create a comprehensive list of:
    - New files/directories in `src`.
    - Deleted files/directories (present in `src-snapshot-1` but not in `src`).
    - Common files/directories (these will need content comparison).

**Key Data Points:**

- [To be filled after recursive listing]

### 3. Content Comparison for Common Files

**Instructions:**

1.  For each file identified as common in both directories:
    - Read the content of the file from `outputs/web-app/v4/voice-step-flow/src`.
    - Read the content of the file from `outputs/web-app/v4/voice-step-flow/src-snapshot-1`.
    - Compare the contents to identify specific changes (additions, deletions, modifications).
    - Document these changes.

**Key Data Points:**

- [To be filled with diff details for each modified file]

### 4. Applying Changes

**Instructions:**

1.  **Create New Files/Directories:** For each new file or directory identified in `outputs/web-app/v4/voice-step-flow/src`, create it in the target location with its new content.
2.  **Delete Old Files/Directories:** For each file or directory present in `outputs/web-app/v4/voice-step-flow/src-snapshot-1` but not in `outputs/web-app/v4/voice-step-flow/src`, delete it from the target location.
3.  **Modify Existing Files:** For each file that has changed, apply the documented modifications to the corresponding file in the target location.

**Key Data Points:**

- Ensure paths are correctly mapped to the target directory.

---

## Files to Modify

- `[List of files in the target directory that will be created]`
- `[List of files in the target directory that will be deleted]`
- `[List of files in the target directory that will be modified, with a summary of changes]`

## Reference Sources

- `outputs/web-app/v4/voice-step-flow/src/` - The source of truth for the updated file structure and content.
- `outputs/web-app/v4/voice-step-flow/src-snapshot-1/` - The reference for the previous state.
- `_createNewUpdate.md` - Template for this update document.

---

## Validation Steps

After implementation:

1.  Verify that all new files and directories from `outputs/web-app/v4/voice-step-flow/src` exist in the target directory.
2.  Verify that all files and directories deleted (i.e., in `src-snapshot-1` but not `src`) are removed from the target directory.
3.  For modified files, perform a diff between the updated file in the target directory and the corresponding file in `outputs/web-app/v4/voice-step-flow/src` to ensure changes were applied correctly.
4.  If the project has build steps or tests, run them to ensure the application is still functional.

---

## Notes

- This update assumes a manual or scripted application of the identified changes.
- Pay close attention to file paths to ensure changes are applied to the correct locations.
- It is highly recommended to back up the target directory before applying these changes.
- The "Prerequisites" section will be updated with specific file paths once the detailed diff is complete.
