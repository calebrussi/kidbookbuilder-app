
import React from 'react';
import { Check, Circle, AlertCircle, Play, Pause } from 'lucide-react';
import { StepStatus, CapturedData } from '../types/userProgress';
import { CapturedDataDisplay } from './CapturedDataDisplay';

interface StepItemProps {
  id: string;
  title: string;
  status: StepStatus;
  onClick: () => void;
  disabled?: boolean;
  capturedData?: CapturedData[];
}

export const StepItem: React.FC<StepItemProps> = ({ 
  id, 
  title, 
  status, 
  onClick, 
  disabled = false,
  capturedData 
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'complete':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-purple-600" />;
      case 'started':
        return <Pause className="w-5 h-5 text-blue-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case 'complete':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'in_progress':
        return 'bg-purple-50 border-purple-300 hover:bg-purple-100 ring-2 ring-purple-200';
      case 'started':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'error':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getTextStyles = () => {
    switch (status) {
      case 'complete':
        return 'text-green-800';
      case 'in_progress':
        return 'text-purple-800 font-medium';
      case 'started':
        return 'text-blue-800';
      case 'error':
        return 'text-red-800';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-0">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full p-4 rounded-lg border-2 transition-all duration-200 
          flex items-center space-x-3 text-left
          ${getStatusStyles()}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${status === 'in_progress' ? 'transform scale-[1.02]' : ''}
        `}
      >
        <div className="flex-shrink-0">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${getTextStyles()}`}>
            {title}
          </p>
        </div>
        
        {status === 'started' && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          </div>
        )}
      </button>
      
      {status === 'complete' && capturedData && (
        <CapturedDataDisplay data={capturedData} stepTitle={title} />
      )}
    </div>
  );
};
