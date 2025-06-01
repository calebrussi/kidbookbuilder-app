# Error Handling and Debug Mode Implementation

## Overview

This document outlines the implementation of robust error handling and a debug mode in the application. These features will help in troubleshooting issues, providing better user feedback, and improving the overall reliability of the application.

## Objective

Implement comprehensive error handling and debugging capabilities:

- Add proper error states for failed operations
- Implement debug mode for development environment
- Add connection state management
- Create error recovery mechanisms
- Provide better user feedback for errors

## Implementation Steps

### 1. Add Error and Debug State to ChatInterface

Enhance the ChatInterface component with error handling and debug mode:

```tsx
// In src/components/ChatInterface.tsx
import React from "react";
import { Mic, MicOff, MessageCircle, AlertCircle, Bug } from "lucide-react";
import { UserProgress, CapturedData, Message } from "../types/userProgress";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  onProgressUpdate?: (updatedProgress: UserProgress) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  progress,
  onCompleteStep,
  onProgressUpdate,
}) => {
  // Existing state...
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<boolean>(false);

  // Debug logger function
  const logDebug = React.useCallback(
    (...args: any[]) => {
      if (debug) {
        console.log("[ChatInterface Debug]", ...args);
      }
    },
    [debug]
  );

  // Toggle debug mode
  const toggleDebug = React.useCallback(() => {
    setDebug((prev) => {
      const newValue = !prev;
      console.log(`Debug mode ${newValue ? "enabled" : "disabled"}`);
      return newValue;
    });
  }, []);

  // Add error handling for agent communication
  const safelyConnectToAgent = React.useCallback(
    async (retryCount = 0) => {
      if (!progress.currentStepId) return null;

      try {
        setIsConnecting(true);
        setConnectionAttempts(retryCount + 1);
        logDebug(`Connecting to agent, attempt ${retryCount + 1}`);

        // Simulated connection attempt (replace with actual implementation)
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Connection successful
        setIsConnecting(false);
        setLastError(null);
        logDebug("Connection successful");
        return true;
      } catch (error) {
        // Connection failed
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        logDebug("Connection failed:", errorMessage);
        setLastError(`Failed to connect: ${errorMessage}`);

        // Auto-retry if within limits
        if (retryCount < 3) {
          logDebug(`Retrying connection (${retryCount + 1}/3)...`);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * (retryCount + 1))
          );
          return safelyConnectToAgent(retryCount + 1);
        } else {
          setIsConnecting(false);
          return false;
        }
      }
    },
    [progress.currentStepId, logDebug]
  );

  // Add error recovery functionality
  const recoverFromError = React.useCallback(async () => {
    setLastError(null);
    return safelyConnectToAgent();
  }, [safelyConnectToAgent]);

  // Update UI to include error state and debug controls
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      {/* Existing UI... */}

      {/* Add error display */}
      {lastError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {lastError}
            <button
              onClick={recoverFromError}
              className="text-sm underline ml-2"
            >
              Try again
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Add connection status */}
      {isConnecting && (
        <div className="text-sm text-amber-600 flex items-center justify-center mb-4">
          <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse mr-2"></div>
          Connecting to voice service... Attempt {connectionAttempts}/3
        </div>
      )}

      {/* Add debug panel in development */}
      {debug && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md text-xs font-mono text-gray-700 overflow-auto">
          <div className="font-bold mb-1">Debug Info:</div>
          <div>Current Step: {progress.currentStepId || "none"}</div>
          <div>
            Status:{" "}
            {progress.currentStepId
              ? progress.stepProgress[progress.currentStepId]?.status
              : "unknown"}
          </div>
          <div>
            Messages:{" "}
            {progress.currentStepId
              ? progress.stepProgress[progress.currentStepId]?.messages
                  ?.length || 0
              : 0}
          </div>
          <div>Connection: {isConnecting ? "connecting" : "idle"}</div>
          <div>Error: {lastError || "none"}</div>
        </div>
      )}

      {/* Existing chat UI... */}

      {/* Add debug toggle button in development */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={toggleDebug}
          className="absolute bottom-4 right-4 text-xs text-gray-400 hover:text-gray-600 flex items-center"
          title="Toggle debug mode"
        >
          <Bug className="w-3 h-3 mr-1" />
          {debug ? "Disable Debug" : "Enable Debug"}
        </button>
      )}
    </div>
  );
};
```

### 2. Add Global Error Handling

Create a global error boundary component:

```tsx
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-md">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-red-600 text-xl">!</span>
            </div>
            <h1 className="text-xl font-semibold text-red-800">
              Something went wrong
            </h1>
            <p className="text-red-600">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Add Error Handling to StorageService

Enhance the storageService with better error handling:

```typescript
// In src/services/storageService.ts
import { LocalStorageSchema } from "../types/storage";
import { UserProgress } from "../types/userProgress";
import { v4 as uuidv4 } from "uuid";

// Constants
const STORAGE_KEY = "todo_app_storage";
const MAX_RETRY_ATTEMPTS = 3;

export const storageService = {
  // Save all data to localStorage with retry
  saveAllData: (data: LocalStorageSchema): boolean => {
    let attempts = 0;
    let success = false;

    while (attempts < MAX_RETRY_ATTEMPTS && !success) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        success = true;
      } catch (error) {
        console.error(
          `Failed to save to localStorage (attempt ${attempts + 1}):`,
          error
        );
        attempts += 1;

        // On final attempt, try to save with less data
        if (attempts === MAX_RETRY_ATTEMPTS) {
          try {
            // Save just the essential data
            const minimalData = {
              currentSession: data.currentSession,
              // Add minimal user progress without message history
              userProgress: Object.fromEntries(
                Object.entries(data.userProgress).map(([key, progress]) => [
                  key,
                  {
                    ...progress,
                    stepProgress: Object.fromEntries(
                      Object.entries(progress.stepProgress).map(
                        ([stepId, step]) => [
                          stepId,
                          {
                            ...step,
                            messages: undefined, // Don't store messages
                          },
                        ]
                      )
                    ),
                  },
                ])
              ),
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalData));
            console.warn("Saved with reduced data to avoid storage limits");
            success = true;
          } catch (fallbackError) {
            console.error("Even fallback storage failed:", fallbackError);
          }
        }
      }
    }

    return success;
  },

  // Load all data from localStorage with error handling
  loadAllData: (): LocalStorageSchema | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as LocalStorageSchema;
    } catch (error) {
      console.error("Failed to load from localStorage:", error);

      // Try to recover corrupted data
      try {
        // Clear potentially corrupted data
        localStorage.removeItem(STORAGE_KEY);
      } catch (clearError) {
        console.error(
          "Failed to clear corrupted localStorage data:",
          clearError
        );
      }

      return null;
    }
  },

  // Get current session with fallback
  getCurrentSession: () => {
    const allData = storageService.loadAllData();

    // If we have valid data with a session, return it
    if (allData && allData.currentSession) {
      return allData.currentSession;
    }

    // Otherwise create a new session
    const newSession = {
      sessionId: uuidv4(),
      workflowId: "character-creation-quiz", // Default workflow
    };

    // Save the new session
    storageService.saveAllData({
      currentSession: newSession,
      userProgress: {},
    });

    return newSession;
  },

  // Get user progress with validation
  getUserProgress: (sessionId: string): UserProgress | null => {
    const allData = storageService.loadAllData();

    if (!allData || !allData.userProgress || !allData.userProgress[sessionId]) {
      return null;
    }

    // Validate the structure
    const progress = allData.userProgress[sessionId];

    // Basic validation of required fields
    if (!progress.workflowId || !progress.sessionId || !progress.stepProgress) {
      console.error("Invalid progress data structure");
      return null;
    }

    // Fix dates (they come as strings from JSON)
    return fixProgressDates(progress);
  },

  // Save user progress with validation
  saveUserProgress: (progress: UserProgress): boolean => {
    if (!progress || !progress.sessionId) {
      console.error("Cannot save invalid progress");
      return false;
    }

    const allData = storageService.loadAllData() || {
      currentSession: {
        sessionId: progress.sessionId,
        workflowId: progress.workflowId,
      },
      userProgress: {},
    };

    // Update the progress entry
    allData.userProgress[progress.sessionId] = progress;

    // Save all data
    return storageService.saveAllData(allData);
  },

  // Clear all storage (for testing or reset)
  clearAll: (): boolean => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error("Failed to clear localStorage:", error);
      return false;
    }
  },
};

// Helper to fix date objects that come back as strings from JSON
function fixProgressDates(progress: UserProgress): UserProgress {
  const fixedProgress = { ...progress };

  // Fix session dates
  if (fixedProgress.sessionData) {
    fixedProgress.sessionData = {
      ...fixedProgress.sessionData,
      startedAt: new Date(fixedProgress.sessionData.startedAt),
      lastActivityAt: new Date(fixedProgress.sessionData.lastActivityAt),
    };
  }

  // Fix step progress dates
  Object.keys(fixedProgress.stepProgress).forEach((stepId) => {
    const step = fixedProgress.stepProgress[stepId];

    const fixedStep = {
      ...step,
      lastModified: new Date(step.lastModified),
    };

    if (step.startedAt) {
      fixedStep.startedAt = new Date(step.startedAt);
    }

    if (step.completedAt) {
      fixedStep.completedAt = new Date(step.completedAt);
    }

    // Fix message timestamps
    if (step.messages && Array.isArray(step.messages)) {
      fixedStep.messages = step.messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }

    // Fix captured data timestamps
    if (step.capturedData && Array.isArray(step.capturedData)) {
      fixedStep.capturedData = step.capturedData.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }

    fixedProgress.stepProgress[stepId] = fixedStep;
  });

  return fixedProgress;
}
```

### 4. Add Alert Components

Create reusable alert components for consistent error display:

```tsx
// src/components/ui/alert.tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive bg-destructive/10 dark:border-destructive [&>svg]:text-destructive",
        warning:
          "border-yellow-500/50 text-yellow-600 bg-yellow-50 [&>svg]:text-yellow-600",
        success:
          "border-emerald-500/50 text-emerald-600 bg-emerald-50 [&>svg]:text-emerald-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
```

### 5. Update App Component with Error Boundary

Wrap the application with the error boundary:

```tsx
// In src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
```

### 6. Add Diagnostic Components

Create a diagnostic component to help debug issues in development environment:

```tsx
// src/components/DiagnosticPanel.tsx
import React from "react";
import { UserProgress } from "../types/userProgress";

interface DiagnosticPanelProps {
  progress: UserProgress;
  visible: boolean;
}

export const DiagnosticPanel: React.FC<DiagnosticPanelProps> = ({
  progress,
  visible,
}) => {
  if (!visible) return null;

  // Function to safely stringify complex objects
  const safeStringify = (obj: any): string => {
    try {
      return JSON.stringify(
        obj,
        (key, value) => {
          // Handle circular references
          if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
              return "[Circular]";
            }
            seen.add(value);
          }
          return value;
        },
        2
      );
    } catch (error) {
      return `[Error serializing: ${error}]`;
    }
  };

  // Track seen objects to handle circular references
  const seen = new Set();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-green-400 p-4 h-64 overflow-auto text-xs">
      <div className="flex justify-between mb-2">
        <h3 className="font-bold">Debug Panel</h3>
        <div>
          <button
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded mr-2"
            onClick={() => console.log("Current progress:", progress)}
          >
            Log to Console
          </button>
        </div>
      </div>
      <pre className="font-mono whitespace-pre-wrap">
        {safeStringify({
          currentStepId: progress.currentStepId,
          sessionId: progress.sessionId,
          workflowId: progress.workflowId,
          overallProgress: progress.overallProgress,
          sessionData: progress.sessionData,
          stepProgress: Object.keys(progress.stepProgress).map((key) => ({
            id: key,
            status: progress.stepProgress[key].status,
            messageCount: progress.stepProgress[key].messages?.length || 0,
            dataCaptured: progress.stepProgress[key].capturedData?.length || 0,
          })),
        })}
      </pre>
    </div>
  );
};
```

## Testing

After implementation, test the following:

1. Error recovery mechanisms when service connections fail
2. Debug mode functionality in development environment
3. Storage error handling, particularly with localStorage limits
4. User feedback during error states
5. Application behavior when errors occur in different components

## Notes

- The debug mode should only be visible in development environments
- Consider adding analytics to track errors in production
- Local storage has size limitations (usually 5-10MB); handle this constraint gracefully
- For production, implement more sophisticated error reporting
