import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { WorkflowHeader } from '../components/WorkflowHeader';
import { StepList } from '../components/StepList';
import { ChatInterface } from '../components/ChatInterface';
import { AuthForm } from '../components/AuthForm';
import { UserProfile } from '../components/UserProfile';
import { useWorkflow } from '../hooks/useWorkflow';
import { useProgress } from '../hooks/useProgress';
import { useProcessing } from '../hooks/useProcessing';
import { useAuth } from '../context/AuthContext';
import { useRealtimeProgress } from '../hooks/useRealtimeProgress';
import { PersonalizedAgentService } from '../services/personalizedAgentService';

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [currentAgentId, setCurrentAgentId] = useState<string | undefined>(undefined);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [storyCreationMode, setStoryCreationMode] = useState(false);
  
  const { user, loading: authContextLoading, signIn, signUp } = useAuth();
  const isAuthenticated = !!user;

  // Check for story creation mode from URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    
    if (mode === 'story-creation') {
      console.log('📖 Story creation mode detected');
      setStoryCreationMode(true);
      
      // Clear the URL parameter to keep URL clean
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);
  
  const { workflow, loading: workflowLoading, error } = useWorkflow(isAuthenticated, storyCreationMode);
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

  // Get real-time connection status for debug panel
  const { isConnected: isRealtimeConnected } = useRealtimeProgress({
    userId: user?.id,
    workflowId: workflow?.id || 'character-creation-quiz',
    enabled: !!user && !!workflow // Re-enable real-time
  });

  // Initialize the processing service and pass the current progress state and handlers
  useProcessing(true, progress, {
    onConversationIdUpdate: updateStepConversationId,
    onConversationProgressUpdate: updateStepConversationProgress
  });

  // Update agent ID when progress or workflow changes
  useEffect(() => {
    const updateAgentId = async () => {
      console.log('🔧 updateAgentId called:', { 
        hasProgress: !!progress, 
        hasWorkflow: !!workflow, 
        hasUser: !!user,
        currentStepId: progress?.currentStepId 
      });
      
      if (!progress || !workflow || !user) {
        console.log('⏹️ Missing required data, setting agentId to undefined');
        setCurrentAgentId(undefined);
        return;
      }

      // Clear current agent ID while resolving new one
      console.log('🔄 Clearing current agent ID and resolving new one...');
      setCurrentAgentId(undefined);

      try {
        console.log('🚀 Starting agent resolution...');
        
        // Check if we need to refresh personalization after new data capture
        if (progress.shouldRefreshPersonalization) {
          console.log('🔄 PERSONALIZATION REFRESH: Data capture completed, re-extracting user data...');
        }
        
        // Extract user personalization data from progress (this will now have the latest data)
        const userPersonalization = PersonalizedAgentService.extractPersonalizationFromProgress(progress);
        console.log('📊 Extracted personalization data:', userPersonalization);
        
        // Add timeout to prevent hanging - increased for dynamic agent creation
        const timeoutPromise = new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error('Agent resolution timeout')), 30000)
        );
        
        const agentPromise = PersonalizedAgentService.getAgentForStep(
          user.id,
          progress.currentStepId,
          workflow,
          userPersonalization
        );
        
        const agentId = await Promise.race([agentPromise, timeoutPromise]);
        console.log('🎯 Agent ID resolved:', agentId);
        setCurrentAgentId(agentId);
      } catch (error) {
        console.error('❌ Error getting agent ID:', error);
        // Fallback to direct workflow lookup
        const fallbackAgentId = workflow.sections
          .flatMap(s => s.steps)
          .find(step => step.id === progress.currentStepId)?.agentId;
        console.log('🔄 Using fallback agent ID:', fallbackAgentId);
        setCurrentAgentId(fallbackAgentId);
      }
    };

    updateAgentId();
  }, [progress?.currentStepId, workflow, user]);

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

  // Check if we're in story creation mode
  const isStoryCreationMode = workflow?.id === 'story-creation';

  // Function to go back to character quiz
  const handleBackToCharacterQuiz = () => {
    // Clear any story-related data and navigate back
    navigate('/');
    window.location.reload(); // Force reload to get character quiz workflow
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
    return currentAgentId;
  };

  // Check if character quiz is complete
  const isCharacterQuizComplete = () => {
    if (!progress) return false;
    
    const requiredSteps = ['name', 'story-preferences', 'character-details'];
    const completionStatus = requiredSteps.map(stepId => ({
      stepId,
      status: progress.stepProgress[stepId]?.status,
      isComplete: progress.stepProgress[stepId]?.status === 'complete'
    }));
    
    // Check if workflow is complete by either:
    // 1. All required steps are marked as complete, OR
    // 2. The workflow has reached 'workflow_complete' state
    const allStepsComplete = requiredSteps.every(stepId => 
      progress.stepProgress[stepId]?.status === 'complete'
    );
    const workflowComplete = progress.currentStepId === 'workflow_complete';
    const allComplete = allStepsComplete || workflowComplete;
    
    console.log('🎯 Quiz completion check:', {
      allComplete,
      allStepsComplete,
      workflowComplete,
      currentStepId: progress.currentStepId,
      completionStatus,
      totalSteps: Object.keys(progress.stepProgress).length,
      stepProgressSnapshot: Object.fromEntries(
        Object.entries(progress.stepProgress).map(([key, value]) => [key, { status: value.status, success: value.success }])
      )
    });
    
    return allComplete;
  };

  // Get user name for personalization
  const getUserName = () => {
    if (!progress) return '';
    
    const personalization = PersonalizedAgentService.extractPersonalizationFromProgress(progress);
    return personalization.userName || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Story Creation Mode Indicator */}
        {isStoryCreationMode && (
          <div className="bg-gradient-to-r from-green-500 to-teal-500 text-white p-6 rounded-lg shadow-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  📖 Story Creation Mode
                </h2>
                <p className="text-lg">
                  Now talk with your personalized agents to create your story!
                </p>
              </div>
              <button 
                onClick={handleBackToCharacterQuiz}
                className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-4 py-2 rounded"
              >
                ← Back to Character Quiz
              </button>
            </div>
          </div>
        )}
        
        {/* Book Generation Prompt - Show when quiz is complete and NOT in story mode */}
        {isCharacterQuizComplete() && !isStoryCreationMode && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-6 rounded-lg shadow-lg mb-6">
            <h2 className="text-2xl font-bold mb-3">
              🎉 Great job, {getUserName()}! Your character is ready!
            </h2>
            <p className="text-lg mb-4">
              Now's create your personalized story! Our AI will generate unique story agents just for you.
            </p>
            <Link to="/book-generation">
              <button className="bg-white text-purple-600 hover:bg-gray-100 font-semibold px-6 py-3 rounded">
                Generate My Story Agents ✨
              </button>
            </Link>
          </div>
        )}
        
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
            {currentAgentId ? (
              <ChatInterface
                progress={progress}
                onCompleteStep={completeCurrentStep}
                agentId={getCurrentStepAgentId()}
                onConversationIdUpdate={updateStepConversationId}
                onConversationProgressUpdate={updateStepConversationProgress}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading conversation agent...</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Discrete Debug Link */}
        <div className="text-center mt-8">
          <Link
            to="/debug"
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            🔧 Debug
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
