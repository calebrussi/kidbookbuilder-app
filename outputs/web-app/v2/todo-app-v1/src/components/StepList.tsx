
import React from 'react';
import { Section, Step } from '../types/workflow';
import StepItem from './StepItem';

interface StepListProps {
  sections: Section[];
  onStepClick: (step: Step) => void;
}

const StepList: React.FC<StepListProps> = ({ sections, onStepClick }) => {
  const isStepClickable = (step: Step, allSteps: Step[]) => {
    const stepIndex = allSteps.findIndex(s => s.id === step.id);
    const inProgressIndex = allSteps.findIndex(s => s.state === 'in_progress');
    
    // Can click current step, or any step before the current in_progress step
    return stepIndex <= inProgressIndex;
  };

  const allSteps = sections.flatMap(section => section.steps);

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
            <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
          </div>
          
          <div className="space-y-3 ml-6">
            {section.steps.map((step) => (
              <StepItem
                key={step.id}
                step={step}
                onClick={onStepClick}
                isClickable={isStepClickable(step, allSteps)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StepList;
