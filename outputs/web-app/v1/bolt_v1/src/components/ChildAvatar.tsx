import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AvatarProps } from '../types';

const ChildAvatar: React.FC<AvatarProps> = ({ 
  currentPosition, 
  targetPosition, 
  isMoving,
  onMoveComplete
}) => {
  const [facingDirection, setFacingDirection] = useState<'left' | 'right'>('right');
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  // Walking animation frames
  useEffect(() => {
    let animationInterval: NodeJS.Timeout;
    
    if (isMoving) {
      // Determine facing direction based on movement
      if (targetPosition.x > currentPosition.x) {
        setFacingDirection('right');
      } else if (targetPosition.x < currentPosition.x) {
        setFacingDirection('left');
      }
      
      // Animate walking frames
      animationInterval = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % 4);
      }, 150);
    } else {
      // Reset to idle frame
      setCurrentFrame(0);
      
      // Clear interval
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    }
    
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isMoving, currentPosition, targetPosition]);
  
  // Handle celebration
  useEffect(() => {
    if (!isMoving && targetPosition !== currentPosition) {
      setIsCelebrating(true);
      const timer = setTimeout(() => {
        setIsCelebrating(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isMoving, currentPosition, targetPosition]);
  
  // Get current animation frame for avatar
  const getAvatarFrame = () => {
    if (isCelebrating) {
      return (
        <div className="relative">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-lg">🎉</span>
            </div>
          </div>
          {/* Celebration particles */}
          <div className="absolute -top-4 -left-4 w-24 h-24">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: ['#F87171', '#60A5FA', '#34D399', '#FBBF24'][i % 4],
                  top: '50%',
                  left: '50%'
                }}
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{ 
                  x: [0, (Math.random() - 0.5) * 50], 
                  y: [0, (Math.random() - 0.5) * 50],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            ))}
          </div>
        </div>
      );
    }
    
    if (isMoving) {
      // Walking animation frames
      return (
        <div className={`w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center transform ${facingDirection === 'left' ? 'scale-x-[-1]' : ''}`}>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <div className="relative">
              <span className="text-lg">👧</span>
              {/* Walking legs animation */}
              <motion.div 
                className="absolute bottom-[-8px] left-[-4px] w-3 h-2 bg-blue-500 rounded-full"
                animate={{ 
                  x: currentFrame % 2 === 0 ? -2 : 2,
                  y: currentFrame % 2 === 0 ? 0 : -2
                }}
              />
              <motion.div 
                className="absolute bottom-[-8px] right-[-4px] w-3 h-2 bg-blue-500 rounded-full"
                animate={{ 
                  x: currentFrame % 2 === 0 ? 2 : -2,
                  y: currentFrame % 2 === 0 ? -2 : 0
                }}
              />
            </div>
          </div>
        </div>
      );
    }
    
    // Idle animation - slightly bouncing
    return (
      <motion.div 
        className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center"
        animate={{ 
          y: [0, -5, 0],
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 2,
          ease: "easeInOut"
        }}
      >
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <span className="text-lg">👧</span>
        </div>
      </motion.div>
    );
  };
  
  return (
    <motion.div
      className="absolute z-30"
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        marginLeft: '-20px',
        marginTop: '-40px',
      }}
      animate={{
        x: targetPosition.x - currentPosition.x,
        y: targetPosition.y - currentPosition.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 20,
        mass: 1,
      }}
      onAnimationComplete={() => {
        if (isMoving) {
          onMoveComplete();
        }
      }}
    >
      {getAvatarFrame()}
    </motion.div>
  );
};

export default ChildAvatar;