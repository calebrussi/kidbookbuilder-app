import React, { useState, useEffect } from 'react';
import { WorkflowHeader } from '../components/WorkflowHeader';
import { StepList } from '../components/StepList';
import { ChatInterface } from '../components/ChatInterface';
import { AuthForm } from '../components/AuthForm';
import { UserProfile } from '../components/UserProfile';
import { useWorkflow } from '../hooks/useWorkflow';
import { useProgress } from '../hooks/useProgress'; // Keep using the original for now
import { useProcessing } from '../hooks/useProcessing';
import { useAuth } from '../context/AuthContext';

const Index = () => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { user, loading: authContextLoading, signIn, signUp } = useAuth();
  const isAuthenticated = !!user;
  
  const { workflow, loading: workflowLoading, error } = useWorkflow(isAuthenticated);
  const { 
    progress, 
    loading: progressLoading, 
    activateStep, 
    completeCurrentStep, 
    canActivateStep,
    resetProgress,
    updateStepConversationId,
    updateStepConversationProgress
  } = useProgress(workflow, workflowLoading);

  // Initialize the processing service and pass the current progress state and handlers
  useProcessing(true, progress, {
    onConversationIdUpdate: updateStepConversationId,
    onConversationProgressUpdate: updateStepConversationProgress
  });

  const handleAuthentication = async (email: string, password: string, isSignUpMode: boolean) => {
    setAuthLoading(true);
    setAuthError(null);
    
    try {
      if (isSignUpMode) {
        await signUp(email, password);
        // For sign up, user might need to confirm email
        setAuthError('Please check your email to confirm your account, then sign in.');
      } else {
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      let errorMessage = 'Authentication failed';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account before signing in';
      } else if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Try signing in instead.';
        setAuthMode('signin');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Show loading while checking authentication
  if (authContextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-purple-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthForm 
        onAuth={handleAuthentication}
        loading={authLoading}
        error={authError}
      />
    );
  }

  // Show loading while loading workflow
  if (workflowLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-purple-600 font-medium">
            {user?.email ? `Loading your quiz, ${user.email}...` : 'Loading your quiz...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !workflow || !progress) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h1 className="text-xl font-semibold text-red-800">Oops! Something went wrong</h1>
          <p className="text-red-600">{error || 'Failed to load the quiz'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getCurrentStepAgentId = () => {
    if (!progress || !workflow) return undefined;
    
    return workflow.sections
      .flatMap(s => s.steps)
      .find(step => step.id === progress.currentStepId)?.agentId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <UserProfile />
        <WorkflowHeader 
          title={workflow.title} 
          progress={progress} 
          onReset={resetProgress}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <StepList
              sections={workflow.sections}
              progress={progress}
              onStepClick={activateStep}
              canActivateStep={canActivateStep}
            />
          </div>
          
          <div className="lg:sticky lg:top-8 lg:self-start">
            <ChatInterface
              progress={progress}
              onCompleteStep={completeCurrentStep}
              agentId={getCurrentStepAgentId()}
              onConversationIdUpdate={updateStepConversationId}
              onConversationProgressUpdate={updateStepConversationProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
