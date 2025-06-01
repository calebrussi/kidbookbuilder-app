import React, { createContext, useContext, useState, useEffect } from 'react';
import { Workflow, Step, Group, Position } from '../types';
import { workflowData } from '../data/workflow';

interface WorkflowContextType {
  workflow: Workflow;
  activeStepId: string | null;
  activeGroupId: string | null;
  companionExplaining: boolean;
  setActiveStep: (stepId: string) => void;
  updateStepState: (stepId: string, state: Step['state']) => void;
  getStepPosition: (groupIndex: number, stepIndex: number) => Position;
  getGroupPosition: (groupIndex: number) => Position;
  getActiveStepPosition: () => Position;
  isStepActive: (stepId: string) => boolean;
  isGroupActive: (groupId: string) => boolean;
  isGroupCompleted: (groupId: string) => boolean;
  setCompanionExplaining: (explaining: boolean) => void;
  currentAreaDescription: string | undefined;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workflow, setWorkflow] = useState<Workflow>(workflowData);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [companionExplaining, setCompanionExplaining] = useState<boolean>(false);
  const [currentAreaDescription, setCurrentAreaDescription] = useState<string | undefined>(undefined);

  // Find the in_progress step on initial load
  useEffect(() => {
    const findInProgressStep = () => {
      for (const group of workflow.groups) {
        for (const step of group.steps) {
          if (step.state === 'in_progress') {
            setActiveStepId(step.id);
            setActiveGroupId(group.id);
            setCurrentAreaDescription(group.description);
            setCompanionExplaining(true);
            return;
          }
        }
      }
    };

    findInProgressStep();
  }, []);

  const setActiveStep = (stepId: string) => {
    // First, find which group contains this step
    let targetGroupId: string | null = null;
    let targetStep: Step | null = null;

    for (const group of workflow.groups) {
      for (const step of group.steps) {
        if (step.id === stepId) {
          targetGroupId = group.id;
          targetStep = step;
          break;
        }
      }
      if (targetGroupId) break;
    }

    if (!targetGroupId || !targetStep) return;

    // Only allow activating steps that are started or complete
    if (targetStep.state === 'not_started') return;

    // Set previous in_progress step to started
    const updatedGroups = workflow.groups.map(group => {
      return {
        ...group,
        steps: group.steps.map(step => {
          if (step.state === 'in_progress') {
            return { ...step, state: 'started' };
          }
          if (step.id === stepId) {
            return { ...step, state: 'in_progress' };
          }
          return step;
        })
      };
    });

    setWorkflow({ ...workflow, groups: updatedGroups });
    setActiveStepId(stepId);
    setActiveGroupId(targetGroupId);

    // If changing to a different group, trigger companion explanation
    if (targetGroupId !== activeGroupId) {
      const newGroup = workflow.groups.find(g => g.id === targetGroupId);
      if (newGroup) {
        setCurrentAreaDescription(newGroup.description);
        setCompanionExplaining(true);
      }
    }
  };

  const updateStepState = (stepId: string, state: Step['state']) => {
    const updatedGroups = workflow.groups.map(group => {
      return {
        ...group,
        steps: group.steps.map(step => {
          if (step.id === stepId) {
            return { ...step, state };
          }
          return step;
        })
      };
    });

    setWorkflow({ ...workflow, groups: updatedGroups });

    // If completing the current step, find the next step to activate
    if (state === 'complete' && activeStepId === stepId) {
      let foundCurrentStep = false;
      let nextStepId: string | null = null;

      // Look through all groups and steps to find the next not_started step
      for (const group of updatedGroups) {
        for (const step of group.steps) {
          if (foundCurrentStep && step.state === 'not_started') {
            nextStepId = step.id;
            break;
          }
          if (step.id === stepId) {
            foundCurrentStep = true;
          }
        }
        if (nextStepId) break;
      }

      // If found a next step, activate it
      if (nextStepId) {
        const newUpdatedGroups = updatedGroups.map(group => {
          return {
            ...group,
            steps: group.steps.map(step => {
              if (step.id === nextStepId) {
                return { ...step, state: 'in_progress' };
              }
              return step;
            })
          };
        });

        setWorkflow({ ...workflow, groups: newUpdatedGroups });
        
        // Find the group of the next step
        let nextGroupId: string | null = null;
        for (const group of newUpdatedGroups) {
          if (group.steps.some(step => step.id === nextStepId)) {
            nextGroupId = group.id;
            break;
          }
        }
        
        setActiveStepId(nextStepId);
        
        // If changing to a different group, trigger companion explanation
        if (nextGroupId && nextGroupId !== activeGroupId) {
          setActiveGroupId(nextGroupId);
          const newGroup = workflow.groups.find(g => g.id === nextGroupId);
          if (newGroup) {
            setCurrentAreaDescription(newGroup.description);
            setCompanionExplaining(true);
          }
        } else {
          setActiveGroupId(nextGroupId);
        }
      }
    }
  };

  // Calculate positions for steps and groups on the quest map
  const getStepPosition = (groupIndex: number, stepIndex: number): Position => {
    // Base step position calculation
    const baseX = 100 + groupIndex * 250;
    const baseY = 200 + stepIndex * 100;

    // Add some variation to make it look more natural
    const xOffset = Math.sin(stepIndex * 0.8) * 30;
    const yOffset = Math.cos(stepIndex * 0.5) * 20;

    return {
      x: baseX + xOffset,
      y: baseY + yOffset,
    };
  };

  const getGroupPosition = (groupIndex: number): Position => {
    return {
      x: 100 + groupIndex * 250,
      y: 100,
    };
  };

  const getActiveStepPosition = (): Position => {
    if (!activeStepId) return { x: 100, y: 200 }; // Default position

    // Find the active step
    for (let groupIndex = 0; groupIndex < workflow.groups.length; groupIndex++) {
      const group = workflow.groups[groupIndex];
      for (let stepIndex = 0; stepIndex < group.steps.length; stepIndex++) {
        const step = group.steps[stepIndex];
        if (step.id === activeStepId) {
          return getStepPosition(groupIndex, stepIndex);
        }
      }
    }

    return { x: 100, y: 200 }; // Fallback position
  };

  const isStepActive = (stepId: string): boolean => {
    return stepId === activeStepId;
  };

  const isGroupActive = (groupId: string): boolean => {
    return groupId === activeGroupId;
  };

  const isGroupCompleted = (groupId: string): boolean => {
    const group = workflow.groups.find(g => g.id === groupId);
    if (!group) return false;
    
    return group.steps.every(step => step.state === 'complete');
  };

  return (
    <WorkflowContext.Provider
      value={{
        workflow,
        activeStepId,
        activeGroupId,
        companionExplaining,
        setActiveStep,
        updateStepState,
        getStepPosition,
        getGroupPosition,
        getActiveStepPosition,
        isStepActive,
        isGroupActive,
        isGroupCompleted,
        setCompanionExplaining,
        currentAreaDescription,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};