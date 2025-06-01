
import React from 'react';

interface WorkflowHeaderProps {
  title: string;
  currentStep: number;
  totalSteps: number;
}

const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ title, currentStep, totalSteps }) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-600 min-w-max">
            {currentStep} of {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WorkflowHeader;
