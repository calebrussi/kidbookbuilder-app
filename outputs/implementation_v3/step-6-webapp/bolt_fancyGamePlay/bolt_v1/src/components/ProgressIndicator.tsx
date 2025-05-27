import React from 'react';
import { motion } from 'framer-motion';
import { Workflow } from '../types';

interface ProgressIndicatorProps {
  workflow: Workflow;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ workflow }) => {
  // Calculate total steps and completed steps
  const totalSteps = workflow.groups.reduce((sum, group) => sum + group.steps.length, 0);
  const completedSteps = workflow.groups.reduce(
    (sum, group) => sum + group.steps.filter(step => step.state === 'complete').length,
    0
  );
  
  // Calculate percentage
  const completionPercentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  
  // Calculate group completion
  const groupProgress = workflow.groups.map(group => {
    const groupTotalSteps = group.steps.length;
    const groupCompletedSteps = group.steps.filter(step => step.state === 'complete').length;
    const groupPercentage = groupTotalSteps > 0 
      ? Math.round((groupCompletedSteps / groupTotalSteps) * 100)
      : 0;
    
    return {
      id: group.id,
      name: group.name,
      percentage: groupPercentage,
      completed: groupCompletedSteps,
      total: groupTotalSteps
    };
  });
  
  return (
    <motion.div 
      className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 w-64 z-50"
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <h2 className="font-bold text-lg mb-2">{workflow.workflowName}</h2>
      
      {/* Overall progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <motion.div 
            className="bg-blue-600 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {completedSteps} of {totalSteps} quests completed
        </div>
      </div>
      
      {/* Group progress */}
      <div className="space-y-2">
        {groupProgress.map((group) => (
          <div key={group.id} className="text-xs">
            <div className="flex justify-between items-center">
              <span className="font-medium">{group.name}</span>
              <span>{group.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <motion.div 
                className={`h-1.5 rounded-full ${
                  group.percentage === 100 
                    ? 'bg-green-500' 
                    : group.percentage > 0 
                      ? 'bg-yellow-400' 
                      : 'bg-gray-300'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${group.percentage}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {/* Celebration message */}
      {completionPercentage === 100 && (
        <motion.div 
          className="mt-4 p-2 bg-green-100 rounded-lg text-green-800 text-sm font-medium text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: [0.9, 1.1, 1],
          }}
          transition={{ duration: 0.5 }}
        >
          🎉 You've completed your story! 🎉
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProgressIndicator;