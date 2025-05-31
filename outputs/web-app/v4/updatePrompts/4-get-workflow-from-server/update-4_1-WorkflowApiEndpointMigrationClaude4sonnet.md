# Update - Workflow API Endpoint Migration

## How to Use This Document

This document provides a comprehensive guide for migrating the workflow service from loading local JSON data to fetching workflow data from an API endpoint.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/update-WorkflowApiEndpointMigration.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `outputs/web-app/v4/voice-step-flow/src-snapshot-3/services/workflowService.ts`
- `outputs/web-app/v4/voice-step-flow/src/services/workflowService.ts`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

This update migrates the workflow service from importing a local `workflow.json` file to fetching workflow data from a configurable API endpoint. The change includes enhanced error handling and additional safety checks for array validation to prevent runtime errors when processing workflow sections and steps.

---

## Implementation Steps

### 1. Remove Local JSON Import and Add API Endpoint Integration

**Instructions:**

1. Remove the local import of `workflow.json` from the workflowService.ts file
2. Replace the local data loading with API endpoint fetching using the `VITE_API_BASE_URL` environment variable
3. Add proper error handling for network requests and API responses
4. Maintain the same date object conversion functionality for `createdAt` and `updatedAt` fields

**Key Data Points:**

- API endpoint: `${apiBaseUrl}/api/workflow.json`
- Default API base URL: `http://localhost:3001`
- Environment variable: `VITE_API_BASE_URL`
- Maintains backward compatibility with existing workflow data structure

### 2. Enhance Array Safety Checks

**Instructions:**

1. Add additional safety checks in the `getAllSteps()` method to prevent runtime errors
2. Validate that `workflow.sections` is an array before processing
3. Validate that each `section.steps` is an array before iterating
4. Ensure the method gracefully handles malformed workflow data

**Key Data Points:**

- Enhanced null/undefined checking for workflow sections
- Array validation before forEach operations
- Graceful fallback to empty arrays when data is malformed

---

## Files to Modify

- `src/services/workflowService.ts` - Migrate from local JSON import to API endpoint fetching with enhanced safety checks

## Reference Sources

- `src-snapshot-3/services/workflowService.ts` - Original implementation with local JSON import
- Environment configuration for `VITE_API_BASE_URL` setup

---

## Validation Steps

After implementation:

1. Verify that the application no longer imports the local `workflow.json` file
2. Test that the workflow service successfully fetches data from the API endpoint
3. Confirm that the environment variable `VITE_API_BASE_URL` is properly utilized
4. Validate that error handling works correctly when the API is unavailable
5. Test that the enhanced array safety checks prevent runtime errors with malformed data
6. Ensure that existing workflow functionality remains intact

---

## Notes

- **API Endpoint Configuration**: The service uses `VITE_API_BASE_URL` environment variable with a fallback to `http://localhost:3001`
- **Backward Compatibility**: Date object conversion for `createdAt` and `updatedAt` fields is preserved
- **Error Handling**: Network failures and API errors are properly caught and logged
- **Data Validation**: Enhanced safety checks prevent runtime errors when processing workflow sections and steps
- **Environment Variables**: Ensure `VITE_API_BASE_URL` is configured in your environment for production deployments
