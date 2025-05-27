import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import QuestArea from './QuestArea';
import ChildAvatar from './ChildAvatar';
import HelpCompanion from './HelpCompanion';
import ProgressIndicator from './ProgressIndicator';
import { Position } from '../types';
import { useWorkflow } from '../context/WorkflowContext';

const QuestMap: React.FC = () => {
  const {
    workflow,
    activeStepId,
    activeGroupId,
    companionExplaining,
    setActiveStep,
    getGroupPosition,
    getActiveStepPosition,
    isGroupActive,
    isGroupCompleted,
    setCompanionExplaining,
    currentAreaDescription,
  } = useWorkflow();

  const [avatarCurrentPos, setAvatarCurrentPos] = useState<Position>({ x: 100, y: 200 });
  const [avatarTargetPos, setAvatarTargetPos] = useState<Position>({ x: 100, y: 200 });
  const [isAvatarMoving, setIsAvatarMoving] = useState(false);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [mapScale, setMapScale] = useState(1);

  // Initialize avatar position and center map
  useEffect(() => {
    const activePosition = getActiveStepPosition();
    setAvatarCurrentPos(activePosition);
    setAvatarTargetPos(activePosition);
    
    const updateMapPosition = () => {
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Calculate total content dimensions
      const totalWidth = workflow.groups.length * 400; // Increased spacing between groups
      const totalHeight = Math.max(...workflow.groups.map(g => g.steps.length)) * 150;
      
      // Calculate offsets to center the content
      const xOffset = (containerWidth - totalWidth) / 2 + 200; // Added extra padding
      const yOffset = (containerHeight - totalHeight) / 2;
      
      setMapOffset({
        x: xOffset,
        y: yOffset,
      });
      
      // Adjust scale based on screen size
      const scale = containerWidth < 768 ? 
        Math.min(containerWidth / (totalWidth + 100), containerHeight / (totalHeight + 100)) : 
        1;
      
      setMapScale(scale);
    };

    updateMapPosition();
    window.addEventListener('resize', updateMapPosition);
    
    return () => window.removeEventListener('resize', updateMapPosition);
  }, [workflow.groups, getActiveStepPosition]);
  
  // Handle step click
  const handleStepClick = (stepId: string) => {
    setActiveStep(stepId);
    const newPosition = getActiveStepPosition();
    setAvatarTargetPos(newPosition);
    setIsAvatarMoving(true);
  };
  
  // Handle avatar movement completion
  const handleAvatarMoveComplete = () => {
    setIsAvatarMoving(false);
    setAvatarCurrentPos(avatarTargetPos);
  };

  // Connect groups with paths
  const renderGroupConnections = () => {
    return workflow.groups.slice(0, -1).map((group, index) => {
      const fromPosition = getGroupPosition(index);
      const toPosition = getGroupPosition(index + 1);
      
      return (
        <svg
          key={`group-path-${group.id}`}
          className="absolute"
          style={{
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          <motion.path
            d={`M${fromPosition.x + 150} ${fromPosition.y + 150} C${fromPosition.x + 250} ${fromPosition.y + 150} ${toPosition.x - 50} ${toPosition.y + 150} ${toPosition.x} ${toPosition.y + 150}`}
            fill="none"
            stroke="#D1D5DB"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5 }}
          />
          <motion.path
            d={`M${fromPosition.x + 150} ${fromPosition.y + 150} C${fromPosition.x + 250} ${fromPosition.y + 150} ${toPosition.x - 50} ${toPosition.y + 150} ${toPosition.x} ${toPosition.y + 150}`}
            fill="none"
            stroke="#FCD34D"
            strokeWidth="4"
            strokeDasharray="8 4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.1 }}
          />
        </svg>
      );
    });
  };
  
  return (
    <div className="relative overflow-hidden w-full h-screen bg-gradient-to-b from-blue-50 to-purple-50">
      {/* Title */}
      <motion.h1 
        className="fixed top-4 left-4 text-2xl font-bold text-purple-600 z-50"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {workflow.workflowName}
      </motion.h1>
      
      {/* Progress indicator */}
      <ProgressIndicator workflow={workflow} />
      
      {/* Map container with zoom and pan */}
      <motion.div
        className="absolute inset-0"
        style={{
          x: mapOffset.x,
          y: mapOffset.y,
          scale: mapScale,
          transformOrigin: 'center',
        }}
        animate={{
          x: mapOffset.x,
          y: mapOffset.y,
          scale: mapScale,
        }}
        transition={{
          type: 'spring',
          stiffness: 100,
          damping: 30,
        }}
      >
        {/* Group connections */}
        {renderGroupConnections()}
        
        {/* Groups */}
        {workflow.groups.map((group, index) => (
          <QuestArea
            key={group.id}
            group={group}
            position={getGroupPosition(index)}
            isActive={isGroupActive(group.id)}
            isCompleted={isGroupCompleted(group.id)}
            onStepClick={handleStepClick}
            activeStepId={activeStepId}
          />
        ))}
        
        {/* Avatar character */}
        <ChildAvatar 
          currentPosition={avatarCurrentPos}
          targetPosition={avatarTargetPos}
          isMoving={isAvatarMoving}
          onMoveComplete={handleAvatarMoveComplete}
        />
        
        {/* Help companion */}
        <HelpCompanion
          position={avatarCurrentPos}
          currentAreaDescription={currentAreaDescription}
          isExplaining={companionExplaining}
          onExplainComplete={() => setCompanionExplaining(false)}
        />
      </motion.div>
      
      {/* Help button */}
      <motion.button
        className="fixed bottom-4 right-4 bg-pink-500 text-white rounded-full p-3 shadow-lg z-50 flex items-center space-x-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span className="text-lg">🎙️</span>
        <span className="pr-2">Voice Chat</span>
      </motion.button>
    </div>
  );
};

export default QuestMap;