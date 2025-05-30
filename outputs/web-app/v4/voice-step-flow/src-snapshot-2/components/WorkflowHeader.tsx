import React from 'react';
import { UserProgress } from '../types/userProgress';
import { storageService } from '../services/storageService';
import { useDebug } from '../context/debugContext'; // Add this import

interface WorkflowHeaderProps {
  title: string;
  progress: UserProgress;
  onReset: () => void;
}

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({ title, progress, onReset }) => {
  const { percentComplete, completedSteps, totalSteps } = progress.overallProgress;
  // const [showDebug, setShowDebug] = useState(false); // Remove this line
  const { showDebug, toggleDebug } = useDebug(); // Add this line
  
  // Function to clear all local storage data (for development troubleshooting)
  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all storage data? This will reset all progress.')) {
      storageService.clearAllData();
      alert('Storage cleared! Please refresh the page.');
    }
  };
  
  const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <div className="flex space-x-2">
          {isDev && (
            <button 
              onClick={toggleDebug} // Update this line
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 transition-colors"
            >
              {showDebug ? 'Hide Debug' : 'Show Debug'}
            </button>
          )}
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      
      {isDev && showDebug && (
        <div className="mb-4 p-3 bg-gray-100 rounded-md text-xs">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">Developer Debug Panel</h3>
            <button
              onClick={handleClearStorage}
              className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear Storage
            </button>
          </div>
          <details>
            <summary className="cursor-pointer">Current Progress State</summary>
            <pre className="mt-2 overflow-auto max-h-60 bg-gray-200 p-2 rounded">
              {JSON.stringify(progress, null, 2)}
            </pre>
          </details>
        </div>
      )}
      
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
