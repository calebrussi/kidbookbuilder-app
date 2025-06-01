import React from 'react';
import { motion } from 'framer-motion';
import QuestStep from './QuestStep';
import AreaBackground from './AreaBackground';
import { AreaProps } from '../types';
import { useWorkflow } from '../context/WorkflowContext';

const QuestArea: React.FC<AreaProps> = ({
  group,
  position,
  isActive,
  isCompleted,
  onStepClick,
  activeStepId,
}) => {
  const { getStepPosition } = useWorkflow();

  return (
    <div className="relative">
      {/* Background for the area */}
      <AreaBackground 
        theme={group.theme} 
        position={position} 
        isActive={isActive}
        isCompleted={isCompleted}
      />
      
      {/* Area Title */}
      <motion.div
        className="absolute z-10 text-center"
        style={{
          left: `${position.x}px`,
          top: `${position.y - 30}px`,
          width: '250px',
          transform: 'translateX(-50%)',
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <motion.h2 
          className={`font-bold text-lg p-2 rounded-full inline-block 
            ${isActive ? 'bg-white shadow-lg text-black' : 'bg-gray-100/80 text-gray-700'}`}
          animate={{ 
            scale: isActive ? [1, 1.05, 1] : 1,
            transition: { 
              repeat: isActive ? Infinity : 0,
              repeatType: 'reverse',
              duration: 1.5
            }
          }}
        >
          {group.name}
        </motion.h2>
      </motion.div>
      
      {/* Steps within this area */}
      {group.steps.map((step, index) => (
        <QuestStep
          key={step.id}
          step={step}
          position={getStepPosition(
            // Find group index
            Array.from(
              { length: position.x / 250 },
              (_, i) => i
            ).length,
            index
          )}
          onClick={() => onStepClick(step.id)}
          isActive={step.id === activeStepId}
        />
      ))}
      
      {/* Path connections between steps */}
      {group.steps.length > 1 && group.steps.slice(0, -1).map((step, index) => {
        const fromPosition = getStepPosition(
          Array.from({ length: position.x / 250 }, (_, i) => i).length,
          index
        );
        const toPosition = getStepPosition(
          Array.from({ length: position.x / 250 }, (_, i) => i).length,
          index + 1
        );
        
        return (
          <svg
            key={`path-${step.id}`}
            className="absolute"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
              zIndex: 5,
              pointerEvents: 'none',
            }}
          >
            <motion.path
              d={`M${fromPosition.x + 24} ${fromPosition.y + 60} C${fromPosition.x + 24} ${
                (fromPosition.y + toPosition.y) / 2
              } ${toPosition.x + 24} ${(fromPosition.y + toPosition.y) / 2} ${
                toPosition.x + 24
              } ${toPosition.y}`}
              fill="none"
              stroke={isActive ? "#FCD34D" : "#D1D5DB"}
              strokeWidth="3"
              strokeDasharray="6 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </svg>
        );
      })}
    </div>
  );
};

export default QuestArea;