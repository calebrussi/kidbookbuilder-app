
import React from 'react';
import { StepItem } from './StepItem';
import { WorkflowSection } from '../types/workflow';
import { UserProgress } from '../types/userProgress';

interface StepListProps {
  sections: WorkflowSection[];
  progress: UserProgress;
  onStepClick: (stepId: string) => void;
  canActivateStep: (stepId: string) => boolean;
}

export const StepList: React.FC<StepListProps> = ({ 
  sections, 
  progress, 
  onStepClick, 
  canActivateStep 
}) => {
  

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {section.title}
          </h2>
          
          <div className="space-y-3">
            {section.steps.map((step) => {
              const stepProgress = progress.stepProgress[step.id];
              const canActivate = canActivateStep(step.id);
              
              return (
                <div key={step.id} className="mb-4">
                  <StepItem
                    key={step.id}
                    id={step.id}
                    title={step.title}
                    status={stepProgress?.status || 'not_started'}
                    conversationStatus={stepProgress?.conversationStatus}
                    success={stepProgress?.success}
                    onClick={() => onStepClick(step.id)}
                    disabled={!canActivate}
                    capturedData={stepProgress?.capturedData}
                    stepProgress={stepProgress}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
