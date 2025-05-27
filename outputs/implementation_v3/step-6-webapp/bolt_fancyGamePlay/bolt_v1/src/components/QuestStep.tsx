import React from 'react';
import { motion } from 'framer-motion';
import { QuestStepProps } from '../types';

const QuestStep: React.FC<QuestStepProps> = ({ step, position, onClick, isActive }) => {
  // Define different appearances based on step state
  const getStepStyles = () => {
    switch (step.state) {
      case 'not_started':
        return 'bg-gray-300 border-gray-400 opacity-50 cursor-not-allowed';
      case 'in_progress':
        return 'bg-yellow-100 border-yellow-400 shadow-lg border-4 scale-110 animate-pulse';
      case 'started':
        return 'bg-blue-100 border-blue-400 cursor-pointer hover:shadow-md hover:scale-105';
      case 'complete':
        return 'bg-green-100 border-green-400 cursor-pointer hover:shadow-md hover:scale-105';
      case 'error':
        return 'bg-red-100 border-red-400 cursor-pointer hover:shadow-md';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Get icon based on step state
  const getStepIcon = () => {
    switch (step.state) {
      case 'not_started':
        return (
          <svg className="w-6 h-6 text-gray-500\" fill="none\" stroke="currentColor\" viewBox="0 0 24 24\" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round\" strokeLinejoin="round\" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'in_progress':
        return (
          <svg className="w-6 h-6 text-yellow-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'started':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const handleClick = () => {
    // Only allow clicking on started or complete steps
    if (step.state === 'started' || step.state === 'complete') {
      onClick();
    }
  };

  const stepVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: isActive ? 1.1 : 1, 
      opacity: 1,
      transition: { 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }
    },
    hover: { 
      scale: step.state === 'not_started' ? 1 : 1.05,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: step.state === 'not_started' ? 1 : 0.95,
      transition: { duration: 0.1 }
    }
  };

  return (
    <motion.div
      className={`absolute rounded-xl p-4 border-2 w-48 h-28 flex flex-col ${getStepStyles()}`}
      style={{ 
        left: `${position.x}px`, 
        top: `${position.y}px`,
        zIndex: isActive ? 20 : 10
      }}
      onClick={handleClick}
      initial="initial"
      animate="animate"
      whileHover="hover"
      whileTap="tap"
      variants={stepVariants}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">{step.title}</h3>
        <div className="flex-shrink-0">{getStepIcon()}</div>
      </div>
      <p className="text-xs text-gray-600">{step.description}</p>
      
      {isActive && (
        <motion.div 
          className="absolute -top-1 -right-1 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 10 }}
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuestStep;