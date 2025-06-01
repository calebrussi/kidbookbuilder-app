# Update - Voice Step Flow Sync To Snapshot 4

## How to Use This Document

This document provides a comprehensive guide for synchronizing the `outputs/web-app/v4/voice-step-flow/src` folder with the latest snapshot in `outputs/web-app/v4/voice-step-flow/src-snapshot-4`. This ensures that all updates, bug fixes, and improvements from the snapshot are reflected in the working source directory.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-VoiceStepFlowSyncToSnapshot4.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files/folders to the chat context (as zipped archives if possible):

- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src-snapshot-4`
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src`

**Important:** Always request these folders from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

This update synchronizes the target folder (`src`) with the latest snapshot (`src-snapshot-4`). All new, updated, or deleted files in the snapshot will be reflected in the target folder. This ensures the codebase is up to date with the latest intended state.

---

## Implementation Steps

### 1. Prepare the Workspace

**Instructions:**

1. Ensure both the source snapshot and target folders are available and backed up.
2. Unzip both folders if they are provided as archives.

**Key Data Points:**

- Source: `outputs/web-app/v4/voice-step-flow/src-snapshot-4`
- Target: `outputs/web-app/v4/voice-step-flow/src`

### 2. Compare Folders

**Instructions:**

1. Use a folder comparison tool (e.g., `diff`, `meld`, VS Code's built-in diff, or a GUI tool) to compare the contents of the source and target folders.
2. Identify all files that are new, changed, or deleted in the snapshot compared to the target.

**Key Data Points:**

- All files and subfolders within both directories

### 3. Update Target Folder

**Instructions:**

1. For each file that is new or updated in the snapshot, copy it to the target folder, overwriting as needed.
2. For any files present in the target but not in the snapshot, delete them from the target folder.
3. Ensure file permissions and structure are preserved.

**Key Data Points:**

- Overwrite existing files with snapshot versions
- Remove obsolete files

### 4. Review and Commit Changes

**Instructions:**

1. Review the updated target folder to ensure all changes are as expected.
2. If using version control, stage and commit the changes with a descriptive message (e.g., `Sync src with src-snapshot-4`).

---

## Files to Modify

- `outputs/web-app/v4/voice-step-flow/src/*` - All files and subfolders that differ from the snapshot will be updated, added, or deleted as needed.

## Reference Sources

- `outputs/web-app/v4/voice-step-flow/src-snapshot-4/*` - Provides the authoritative source for the update.

---

## Validation Steps

After implementation:

1. Run the application or relevant tests to ensure functionality is intact.
2. Manually review the updated files for correctness.
3. Confirm that the target folder matches the snapshot exactly (using a diff tool).
4. Success criteria: No differences between `src` and `src-snapshot-4` and all tests pass.

---

## Notes

- **Backup First**: Always back up the target folder before making bulk changes.
- **Version Control**: Use git or another VCS to track and review changes.
- **Permissions**: Ensure file permissions are preserved during copy operations.
- **Automation**: Consider scripting the sync process for repeatability if this is a common workflow.
- **Best Practice**: Validate the application after syncing to catch any issues early.
