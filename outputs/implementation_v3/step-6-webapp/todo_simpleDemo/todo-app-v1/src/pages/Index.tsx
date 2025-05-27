import React, { useMemo, useEffect } from 'react';
import { characterCreationQuizWorkflow } from '../data/characterCreationQuizWorkflow';
import { StepWithState, StepState, WorkflowWithState } from '../types/workflow';
import WorkflowHeader from '../components/WorkflowHeader';
import StepList from '../components/StepList';
import ChatInterface from '../components/ChatInterface';
import { useUserProgress } from '../hooks/useUserProgress';
import { logProgressValidation } from '../utils/progressValidation';
import { testProgress } from '../utils/browserTest';

// Make test function available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testProgress = testProgress;
}

const Index = () => {
  const { 
    userProgress, 
    stepStates, 
    updateStepState, 
    startConversation, 
    endConversation,
    updateConversationData,
    isLoading 
  } = useUserProgress(characterCreationQuizWorkflow);

  // Create workflow with current step states from progress
  const workflowWithStates: WorkflowWithState = useMemo(() => {
    if (!userProgress || isLoading) {
      // Return workflow with default states when no progress yet
      return {
        ...characterCreationQuizWorkflow,
        sections: characterCreationQuizWorkflow.sections.map(section => ({
          ...section,
          steps: section.steps.map(step => ({
            ...step,
            state: 'not_started' as StepState
          }))
        }))
      };
    }
    
    const updatedWorkflow: WorkflowWithState = {
      ...characterCreationQuizWorkflow,
      sections: characterCreationQuizWorkflow.sections.map(section => ({
        ...section,
        steps: section.steps.map(step => ({
          ...step,
          state: (stepStates[step.id] || 'not_started') as StepState
        }))
      }))
    };
    
    console.log('🔄 Workflow updated with progress states:', {
      workflowId: updatedWorkflow.id,
      stepStates: Object.entries(stepStates).map(([id, state]) => ({ id, state }))
    });
    
    return updatedWorkflow;
  }, [stepStates, userProgress, isLoading]);

  // Calculate workflow state variables
  const allSteps = workflowWithStates.sections.flatMap(section => section.steps);
  const completedSteps = allSteps.filter(step => step.state === 'complete').length;
  const currentStepIndex = allSteps.findIndex(step => step.state === 'in_progress') + 1;
  
  // Get current step in progress for chat interface
  const currentStep = allSteps.find(step => step.state === 'in_progress');
  const currentAgentId = currentStep?.agentId;
  const isStepInProgress = !!currentStep;
  
  // Find first available step (not completed)
  const firstAvailableStep = allSteps.find(step => step.state !== 'complete');
  const hasIncompleteSteps = allSteps.some(step => step.state !== 'complete');

  // Validate progress when it changes
  useEffect(() => {
    if (userProgress && !isLoading) {
      logProgressValidation(userProgress, characterCreationQuizWorkflow);
    }
  }, [userProgress, isLoading]);

  const handleStepClick = (clickedStep: StepWithState) => {
    console.log('🎯 Step clicked:', {
      id: clickedStep.id,
      title: clickedStep.title,
      currentState: clickedStep.state,
      sectionId: clickedStep.sectionId,
      agentId: clickedStep.agentId
    });
    
    // If clicking the current in_progress step, keep it in_progress
    if (clickedStep.state === 'in_progress') {
      console.log('🔄 Step already in progress, no state change needed');
      return;
    }
    
    // Set any current in_progress step back to started
    const currentInProgressStep = allSteps.find(step => step.state === 'in_progress');
    if (currentInProgressStep && currentInProgressStep.id !== clickedStep.id) {
      console.log('📝 Setting previous in_progress step to started:', currentInProgressStep.id);
      updateStepState(currentInProgressStep.id, 'started');
    }
    
    // Set clicked step to in_progress
    console.log('🚀 Setting step to in_progress:', clickedStep.id);
    updateStepState(clickedStep.id, 'in_progress');
  };

  const handleStepComplete = (agentId: string) => {
    console.log('✅ Handling step completion for agent:', agentId);
    
    // Find the step with this agentId that is currently in_progress
    const stepToComplete = allSteps.find(step => 
      step.agentId === agentId && step.state === 'in_progress'
    );
    
    if (stepToComplete) {
      console.log('✅ Completing step:', {
        id: stepToComplete.id,
        title: stepToComplete.title,
        agentId: stepToComplete.agentId
      });
      
      // End conversation and mark step as complete
      endConversation(stepToComplete.id);
      console.log('📝 Step marked as complete:', stepToComplete.id);
    } else {
      console.warn('⚠️ No in_progress step found for agent:', agentId);
      
      // Try to find any step with this agentId for debugging
      const anyStepWithAgent = allSteps.find(step => step.agentId === agentId);
      if (anyStepWithAgent) {
        console.log('🔍 Found step with agent but not in progress:', {
          id: anyStepWithAgent.id,
          title: anyStepWithAgent.title,
          currentState: anyStepWithAgent.state,
          agentId: anyStepWithAgent.agentId
        });
      } else {
        console.error('❌ No step found with agentId:', agentId);
      }
    }
  };

  const handleConversationStart = (stepId: string, conversationId: string) => {
    console.log('🎙️ Conversation started handler called:', { stepId, conversationId });
    console.log('📞 Calling startConversation function...');
    startConversation(stepId, conversationId);
    console.log('✅ startConversation function called');
  };

  const handleConversationData = (stepId: string, data: any) => {
    console.log('💬 Conversation data update:', { stepId, data });
    updateConversationData(stepId, data);
  };

  const handleStartFirstAvailableStep = () => {
    if (firstAvailableStep) {
      console.log('🚀 Starting first available step:', {
        id: firstAvailableStep.id,
        title: firstAvailableStep.title,
        currentState: firstAvailableStep.state
      });
      
      // Set any current in_progress step back to started
      const currentInProgressStep = allSteps.find(step => step.state === 'in_progress');
      if (currentInProgressStep && currentInProgressStep.id !== firstAvailableStep.id) {
        console.log('📝 Setting previous in_progress step to started:', currentInProgressStep.id);
        updateStepState(currentInProgressStep.id, 'started');
      }
      
      // Set first available step to in_progress
      updateStepState(firstAvailableStep.id, 'in_progress');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading workflow progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <WorkflowHeader 
        title={workflowWithStates.title}
        currentStep={currentStepIndex}
        totalSteps={allSteps.length}
      />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Steps Panel */}
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
                <h2 className="text-2xl font-bold text-gray-800">Workflow Steps</h2>
              </div>
              
              <StepList 
                sections={workflowWithStates.sections}
                onStepClick={handleStepClick}
              />
            </div>

            {/* Progress Debug Panel */}
            {userProgress && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-green-500 rounded-full" />
                  <h3 className="text-lg font-semibold text-gray-800">Progress Status</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p><strong>Workflow:</strong> {userProgress.workflowId}</p>
                  <p><strong>Started:</strong> {new Date(userProgress.startedAt).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(userProgress.lastUpdated).toLocaleString()}</p>
                  <p><strong>Completed Steps:</strong> {completedSteps}/{allSteps.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Interface Panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <ChatInterface 
              currentAgentId={currentAgentId}
              currentStepId={currentStep?.id}
              userProgress={userProgress}
              currentConversationId={currentStep?.id ? userProgress?.steps[currentStep.id]?.conversationData?.conversationId : undefined}
              isStepInProgress={isStepInProgress}
              firstAvailableStep={firstAvailableStep}
              onStepComplete={handleStepComplete}
              onConversationStart={handleConversationStart}
              onConversationData={handleConversationData}
              onStartFirstAvailableStep={handleStartFirstAvailableStep}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
