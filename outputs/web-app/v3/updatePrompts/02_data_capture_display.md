# Data Capturing and Display Implementation

## Overview

This document outlines the implementation of capturing and displaying data collected during each workflow step. This feature enhances the user experience by showing a summary of captured information that is read-only and provides context for their progress.

## Objective

Implement functionality to:

- Capture data during workflow steps
- Store the data with user progress
- Display the captured data in a read-only format
- Make the data available across sessions

## Implementation Steps

### 1. Update User Progress Type Definitions

Enhance the `userProgress.ts` file to include CapturedData structure:

```typescript
// In src/types/userProgress.ts
export interface CapturedData {
  label: string;
  value: string;
  timestamp: Date;
}

// Update StepProgress interface to include capturedData
export interface StepProgress {
  stepId: string;
  status: StepStatus;
  conversationId: string;
  startedAt?: Date;
  completedAt?: Date;
  lastModified: Date;
  attemptCount: number;
  userInputs?: Record<string, any>;
  capturedData?: CapturedData[]; // Add this line
}
```

### 2. Create CapturedDataDisplay Component

Create a new component to display captured data in a read-only format:

```tsx
// src/components/CapturedDataDisplay.tsx
import React from "react";
import { CapturedData } from "../types/userProgress";

interface CapturedDataDisplayProps {
  data: CapturedData[];
  stepTitle: string;
}

export const CapturedDataDisplay: React.FC<CapturedDataDisplayProps> = ({
  data,
  stepTitle,
}) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
      <h4 className="text-sm font-medium text-green-800 mb-2">
        {stepTitle} - Captured Data
      </h4>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-green-700 font-medium">
              {item.label}:
            </span>
            <span className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. Update ProgressService

Enhance `progressService.ts` to handle captured data:

```typescript
// Add to progressService.ts
export const updateStepStatus = (
  progress: UserProgress,
  stepId: string,
  status: StepStatus,
  capturedData?: CapturedData[]
): UserProgress => {
  // Existing code...

  // Add handling for captured data
  let updatedStepProgress = {
    ...existingStepProgress,
    status,
    lastModified: new Date(),
  };

  // If status is complete and we have captured data, add it
  if (status === "complete" && capturedData && capturedData.length > 0) {
    updatedStepProgress = {
      ...updatedStepProgress,
      completedAt: new Date(),
      capturedData: capturedData,
    };
  }

  // Rest of existing code...
};

// Add a new function to directly add captured data
export const addCapturedData = (
  progress: UserProgress,
  stepId: string,
  capturedData: CapturedData[]
): UserProgress => {
  const stepProgress = progress.stepProgress[stepId];

  if (!stepProgress) return progress;

  const existingData = stepProgress.capturedData || [];

  // Merge new data with existing data, avoiding duplicates
  const mergedData = [...existingData];

  capturedData.forEach((item) => {
    const existingIndex = mergedData.findIndex(
      (existing) => existing.label === item.label
    );

    if (existingIndex !== -1) {
      mergedData[existingIndex] = item; // Replace with new value
    } else {
      mergedData.push(item); // Add new item
    }
  });

  const updatedStepProgress = {
    ...stepProgress,
    capturedData: mergedData,
    lastModified: new Date(),
  };

  return {
    ...progress,
    stepProgress: {
      ...progress.stepProgress,
      [stepId]: updatedStepProgress,
    },
  };
};
```

### 4. Update StepItem Component

Enhance the StepItem component to display captured data for completed steps:

```tsx
// In src/components/StepItem.tsx
import { CapturedDataDisplay } from "./CapturedDataDisplay";

interface StepItemProps {
  id: string;
  title: string;
  status: StepStatus;
  onClick: () => void;
  disabled?: boolean;
  capturedData?: CapturedData[]; // Add this line
}

export const StepItem: React.FC<StepItemProps> = ({
  id,
  title,
  status,
  onClick,
  disabled = false,
  capturedData, // Add this parameter
}) => {
  // Existing code...

  return (
    <div className={/* existing styles */}>
      {/* Existing content */}

      {capturedData && capturedData.length > 0 && status === "complete" && (
        <div className="mt-2">
          <CapturedDataDisplay data={capturedData} stepTitle={title} />
        </div>
      )}
    </div>
  );
};
```

### 5. Update StepList Component

Update the StepList component to pass captured data to StepItem:

```tsx
// In src/components/StepList.tsx
export const StepList: React.FC<StepListProps> = ({
  sections,
  progress,
  onStepClick,
  canActivateStep,
}) => {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <h3 className="text-lg font-medium text-gray-800">{section.title}</h3>
          <div className="space-y-3">
            {section.steps.map((step) => {
              const stepProgress = progress.stepProgress[step.id] || {
                stepId: step.id,
                status: "not_started",
                conversationId: "",
                lastModified: new Date(),
                attemptCount: 0,
              };

              return (
                <StepItem
                  key={step.id}
                  id={step.id}
                  title={step.title}
                  status={stepProgress.status}
                  onClick={() => onStepClick(step.id)}
                  disabled={!canActivateStep(step.id)}
                  capturedData={stepProgress.capturedData} // Add this line
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
```

### 6. Update ChatInterface Component

Enhance the ChatInterface to show captured data and manage updates:

```tsx
// In src/components/ChatInterface.tsx

// Update interface props
interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  onProgressUpdate?: (updatedProgress: UserProgress) => void; // Add this line
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  onProgressUpdate, // Add this parameter
}) => {
  // Existing code...

  // Add function to handle capturing data
  const captureData = React.useCallback(
    (label: string, value: string) => {
      if (!progress || !progress.currentStepId) return;

      const newItem: CapturedData = {
        label,
        value,
        timestamp: new Date(),
      };

      const updatedProgress = progressService.addCapturedData(
        progress,
        progress.currentStepId,
        [newItem]
      );

      if (onProgressUpdate) {
        onProgressUpdate(updatedProgress);
      }
    },
    [progress, progress.currentStepId, onProgressUpdate]
  );

  // Add to the UI to display current captured data
  const currentStepCapturedData = React.useMemo(() => {
    if (!progress || !progress.currentStepId) return [];
    return progress.stepProgress[progress.currentStepId]?.capturedData || [];
  }, [progress, progress.currentStepId]);

  // Add this to the UI where appropriate
  return (
    <div className={/* existing styles */}>
      {/* Existing UI */}

      {currentStepCapturedData.length > 0 && (
        <CapturedDataDisplay
          data={currentStepCapturedData}
          stepTitle={currentStepTitle}
        />
      )}

      {/* Rest of existing UI */}
    </div>
  );
};
```

### 7. Update Index Component

Update the Index component to pass the new `onProgressUpdate` prop:

```tsx
// In src/pages/Index.tsx
const {
  progress,
  loading: progressLoading,
  activateStep,
  completeCurrentStep,
  canActivateStep,
  resetProgress,
  updateProgress, // Add this line
} = useProgress();

// Later in the JSX
<ChatInterface
  progress={progress}
  onCompleteStep={completeCurrentStep}
  onProgressUpdate={updateProgress} // Add this line
/>;
```

## Testing

After implementation, test the following:

1. Data is correctly captured during step completion
2. Captured data is displayed in the UI as read-only content
3. Data persists across browser sessions
4. Multiple data items can be captured per step

## Notes

- The captured data is completely read-only to users
- The ChatInterface is responsible for determining when data should be captured
- The data capture is triggered programmatically, not by user action
