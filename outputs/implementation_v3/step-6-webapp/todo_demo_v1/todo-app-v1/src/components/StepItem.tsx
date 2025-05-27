
import React from 'react';
import { Check, AlertCircle, Circle, PlayCircle } from 'lucide-react';
import { Step, StepState } from '../types/workflow';

interface StepItemProps {
  step: Step;
  onClick: (step: Step) => void;
  isClickable: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ step, onClick, isClickable }) => {
  const getStepIcon = (state: StepState) => {
    switch (state) {
      case 'complete':
        return <Check className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-white" />;
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-white" />;
      case 'started':
        return <Circle className="w-5 h-5 text-white fill-current" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStepStyles = (state: StepState) => {
    switch (state) {
      case 'complete':
        return 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25';
      case 'error':
        return 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25';
      case 'in_progress':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-500 text-white shadow-lg shadow-purple-500/25 animate-pulse';
      case 'started':
        return 'bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-500/25';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-400';
    }
  };

  const getTextStyles = (state: StepState) => {
    switch (state) {
      case 'complete':
      case 'error':
      case 'in_progress':
      case 'started':
        return 'text-gray-800 font-medium';
      default:
        return 'text-gray-500';
    }
  };

  const handleClick = () => {
    if (isClickable) {
      onClick(step);
    }
  };

  return (
    <div
      className={`
        flex items-center gap-4 p-4 rounded-xl transition-all duration-300 
        ${isClickable ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md hover:scale-[1.02]' : 'cursor-not-allowed'}
        ${step.state === 'in_progress' ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white border border-gray-200'}
      `}
      onClick={handleClick}
    >
      <div className={`
        w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-300
        ${getStepStyles(step.state)}
      `}>
        {getStepIcon(step.state)}
      </div>
      
      <div className="flex-1">
        <h3 className={`text-lg transition-colors duration-300 ${getTextStyles(step.state)}`}>
          {step.title}
        </h3>
      </div>

      {step.state === 'started' && (
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export default StepItem;
