
import React from 'react';
import { WorkflowHeader } from '../components/WorkflowHeader';
import { StepList } from '../components/StepList';
import { ChatInterface } from '../components/ChatInterface';
import { useWorkflow } from '../hooks/useWorkflow';
import { useProgress } from '../hooks/useProgress';

const Index = () => {
  const { workflow, loading: workflowLoading, error } = useWorkflow();
  const { 
    progress, 
    loading: progressLoading, 
    activateStep, 
    completeCurrentStep, 
    canActivateStep,
    resetProgress,
    updateProgress 
  } = useProgress();

  if (workflowLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-purple-600 font-medium">Loading your quiz...</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
              onProgressUpdate={updateProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
