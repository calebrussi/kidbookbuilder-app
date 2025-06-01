import { useState, useEffect } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  userName: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    userName: null,
    loading: false,
    error: null,
  });

  // Check for existing authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('quiz-auth');
    if (storedAuth) {
      try {
        const { userName, timestamp } = JSON.parse(storedAuth);
        // Check if auth is less than 24 hours old
        const isValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
        if (isValid && userName) {
          setAuthState({
            isAuthenticated: true,
            userName,
            loading: false,
            error: null,
          });
        } else {
          localStorage.removeItem('quiz-auth');
        }
      } catch (error) {
        localStorage.removeItem('quiz-auth');
      }
    }
  }, []);

  const authenticate = async (name: string, passcode: string) => {
    setAuthState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // Import workflowService here to avoid circular dependencies
      const { workflowService } = await import('../services/workflowService');
      
      // Try to load workflow with credentials - this will validate both name and passcode
      await workflowService.loadWorkflow(name, passcode);

      // If successful, store auth info in localStorage
      localStorage.setItem('quiz-auth', JSON.stringify({
        userName: name,
        passcode: passcode, // Store for API calls
        timestamp: Date.now(),
      }));

      setAuthState({
        isAuthenticated: true,
        userName: name,
        loading: false,
        error: null,
      });

    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      }));
    }
  };

  const logout = async () => {
    localStorage.removeItem('quiz-auth');
    
    // Reset workflow cache
    const { workflowService } = await import('../services/workflowService');
    workflowService.resetWorkflow();
    
    setAuthState({
      isAuthenticated: false,
      userName: null,
      loading: false,
      error: null,
    });
  };

  const getAuthCredentials = () => {
    const storedAuth = localStorage.getItem('quiz-auth');
    if (storedAuth) {
      try {
        const { userName } = JSON.parse(storedAuth);
        return { userName };
      } catch (error) {
        return null;
      }
    }
    return null;
  };

  return {
    ...authState,
    authenticate,
    logout,
    getAuthCredentials,
  };
};
