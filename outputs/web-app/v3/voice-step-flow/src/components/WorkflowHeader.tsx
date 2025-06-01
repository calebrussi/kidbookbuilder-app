
import React from 'react';
import { UserProgress } from '../types/userProgress';

interface WorkflowHeaderProps {
  title: string;
  progress: UserProgress;
  onReset: () => void;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ title, progress, onReset }) => {
  const { percentComplete, completedSteps, totalSteps } = progress.overallProgress;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <button
          onClick={onReset}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Reset
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium text-gray-900">
            {completedSteps} of {totalSteps} steps completed
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
        
        <div className="text-right">
          <span className="text-sm font-medium text-purple-600">
            {Math.round(percentComplete)}% Complete
          </span>
        </div>
      </div>
    </div>
  );
};
