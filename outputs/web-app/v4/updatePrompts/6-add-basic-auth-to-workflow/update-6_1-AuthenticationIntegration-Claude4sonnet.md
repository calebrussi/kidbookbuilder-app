# Update - Authentication Integration

## How to Use This Document

This document provides a comprehensive guide for adding basic authentication to the workflow system, requiring users to authenticate with name and passcode before accessing the quiz.

**After completing all steps in this document, move this file to the `applied` folder to indicate completion:**

```bash
mkdir -p /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied
mv /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/6-add-basic-auth-to-workflow/update-AuthenticationIntegration.md /Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/updatePrompts/applied/
```

---

## Prerequisites

**REQUIRED ACTION:** Before executing this update, ask the user to attach the following files to the chat context:

- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/components/WorkflowHeader.tsx`
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/hooks/useWorkflow.ts`
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/pages/Index.tsx`
- `/Users/calebrussi/Sites/calebrussi/kidbookbuilder-app/outputs/web-app/v4/voice-step-flow/src/services/workflowService.ts`

**Important:** Always request these files from the user before proceeding with any changes, regardless of what might already be in the chat context.

---

## Task Overview

This update adds basic authentication functionality to the workflow application, requiring users to enter a name and passcode before accessing the quiz. The authentication integrates with the existing workflow service and provides secure access control with session management.

---

## Implementation Steps

### 1. Create Authentication Form Component

**Instructions:**

1. Create a new file `src/components/AuthForm.tsx`
2. Implement a form component that collects name and passcode
3. Include proper validation and error handling
4. Style the form to match the existing application design
5. Handle loading states during authentication

**Key Data Points:**

- Form should collect "name" and "passcode" fields
- Include proper TypeScript interfaces for props
- Use consistent styling with existing components
- Display loading and error states appropriately

### 2. Create Authentication Hook

**Instructions:**

1. Create a new file `src/hooks/useAuth.ts`
2. Implement authentication state management
3. Handle localStorage for session persistence
4. Provide authentication, logout, and session checking functions
5. Integrate with the workflow service for authenticated API calls

**Key Data Points:**

- Store authentication data in localStorage as 'quiz-auth'
- Manage authentication state (isAuthenticated, userName, loading, error)
- Provide authenticate and logout functions
- Clear stored data on logout

### 3. Enhance Workflow Service with Authentication

**Instructions:**

1. Modify the `loadWorkflow` method to accept optional name and passcode parameters
2. Update API call to use POST method with authentication payload
3. Handle authentication credentials from localStorage when not provided as parameters
4. Add proper error handling for authentication failures
5. Add a `resetWorkflow` method to clear cached workflow data

**Key Data Points:**

- API endpoint changes from GET `/api/workflow.json` to POST `/api/workflow`
- Request body includes name and passcode
- Handle stored authentication from localStorage
- Clear workflow cache when credentials are provided (fresh login)

### 4. Update Workflow Hook for Authentication Integration

**Instructions:**

1. Modify `useWorkflow` hook to accept an `isAuthenticated` parameter
2. Update loading state logic to not load when not authenticated
3. Reset workflow state when authentication status changes
4. Update dependency array to trigger re-fetch on authentication changes

**Key Data Points:**

- Hook parameter: `isAuthenticated: boolean = false`
- Initial loading state should be `false`
- Clear workflow data when not authenticated
- Re-run effect when authentication status changes

### 5. Update Index Page with Authentication Flow

**Instructions:**

1. Import and integrate the new `useAuth` hook
2. Pass authentication status to `useWorkflow` hook
3. Conditionally render `AuthForm` when not authenticated
4. Update loading message to include user name when available
5. Ensure proper authentication flow before showing workflow content

**Key Data Points:**

- Show AuthForm when `!isAuthenticated`
- Pass authentication function to AuthForm
- Update loading message to personalize with userName
- Maintain existing workflow rendering logic for authenticated users

### 6. Enhance Workflow Header with Logout Functionality

**Instructions:**

1. Import and use the `useAuth` hook in WorkflowHeader
2. Replace the existing reset function with an enhanced version
3. Include logout functionality in the reset process
4. Add confirmation dialog for reset action
5. Provide user feedback after reset and logout

**Key Data Points:**

- Import `useAuth` hook and extract `logout` function
- Replace `onReset` click handler with new `handleReset` function
- Include confirmation dialog before reset
- Clear both progress data and authentication session
- Show alert message after successful reset and logout

---

## Files to Modify

- `src/components/WorkflowHeader.tsx` - Add logout functionality to reset button
- `src/hooks/useWorkflow.ts` - Add authentication integration and state management
- `src/pages/Index.tsx` - Integrate authentication flow and conditional rendering
- `src/services/workflowService.ts` - Add authentication to API calls and session management

## New Files to Create

- `src/components/AuthForm.tsx` - Authentication form component
- `src/hooks/useAuth.ts` - Authentication state management hook

---

## Validation Steps

After implementation:

1. **Authentication Flow**: Verify that unauthenticated users see the AuthForm
2. **API Integration**: Confirm that workflow API calls include authentication data
3. **Session Persistence**: Test that authentication persists across browser refreshes
4. **Logout Functionality**: Verify that reset button clears both progress and authentication
5. **Error Handling**: Test with invalid credentials to ensure proper error display
6. **Loading States**: Confirm loading indicators work correctly during authentication

---

## Notes

- **Authentication Method**: Uses simple name/passcode combination stored in localStorage
- **API Changes**: Workflow endpoint changes from GET to POST with authentication payload
- **Session Management**: Authentication persists in localStorage until explicit logout
- **Reset Behavior**: Reset button now clears both quiz progress and authentication session
- **Error Handling**: Proper error messages for authentication failures and API issues
- **User Experience**: Smooth transition between authenticated and unauthenticated states
