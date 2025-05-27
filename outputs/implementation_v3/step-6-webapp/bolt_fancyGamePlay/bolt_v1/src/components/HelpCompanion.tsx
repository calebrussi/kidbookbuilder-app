import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CompanionProps } from '../types';

const HelpCompanion: React.FC<CompanionProps> = ({
  position,
  currentAreaDescription,
  isExplaining,
  onExplainComplete
}) => {
  const [showChat, setShowChat] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [animationState, setAnimationState] = useState<'idle' | 'excited' | 'explaining'>('idle');
  
  // Handle explanation state
  useEffect(() => {
    if (isExplaining) {
      setAnimationState('excited');
      setShowChat(true);
      
      // After some time, change to explaining animation and eventually complete
      const excitedTimer = setTimeout(() => {
        setAnimationState('explaining');
        
        const explainTimer = setTimeout(() => {
          setShowChat(false);
          setAnimationState('idle');
          onExplainComplete();
        }, 5000); // Show explanation for 5 seconds
        
        return () => clearTimeout(explainTimer);
      }, 1000); // Excited for 1 second
      
      return () => clearTimeout(excitedTimer);
    }
  }, [isExplaining, onExplainComplete]);
  
  // Get companion character based on animation state
  const getCompanionCharacter = () => {
    switch (animationState) {
      case 'excited':
        return (
          <motion.div 
            className="text-3xl"
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
              scale: [1, 1.2, 1, 1.2, 1]
            }}
            transition={{ 
              duration: 1,
              repeat: Infinity,
              repeatType: "loop"
            }}
          >
            ✨
          </motion.div>
        );
      case 'explaining':
        return (
          <motion.div 
            className="text-3xl"
            animate={{ 
              y: [0, -5, 0],
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            🧚
          </motion.div>
        );
      case 'idle':
      default:
        return (
          <motion.div 
            className="text-3xl"
            animate={{ 
              y: [0, -5, 0],
              rotate: isHovering ? [0, -5, 5, -5, 0] : 0,
              scale: isHovering ? 1.1 : 1
            }}
            transition={{ 
              y: {
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              },
              rotate: {
                duration: 0.5,
                repeat: isHovering ? Infinity : 0,
                repeatType: "loop"
              }
            }}
          >
            🧚
          </motion.div>
        );
    }
  };
  
  const handleCompanionClick = () => {
    if (!isExplaining) {
      setShowChat(!showChat);
    }
  };
  
  return (
    <div className="absolute z-40" style={{ left: `${position.x + 50}px`, top: `${position.y - 50}px` }}>
      {/* Companion Character */}
      <motion.div
        className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center cursor-pointer shadow-lg"
        onClick={handleCompanionClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: isHovering || showChat
            ? '0 0 15px 5px rgba(236, 72, 153, 0.3)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
      >
        {getCompanionCharacter()}
      </motion.div>
      
      {/* Speech Bubble */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            className="absolute left-16 top-0 w-64 bg-white rounded-xl p-4 shadow-lg"
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          >
            {/* Speech bubble pointer */}
            <div className="absolute left-[-8px] top-4 w-0 h-0 border-t-[8px] border-t-transparent border-r-[8px] border-r-white border-b-[8px] border-b-transparent" />
            
            <div className="text-sm">
              <p className="font-bold text-pink-500 mb-2">Fairy Guide</p>
              {currentAreaDescription ? (
                <p>{currentAreaDescription}</p>
              ) : (
                <p>Hi there! I'm your fairy guide. Click on any available quest to continue your adventure. Need help? Just click me anytime!</p>
              )}
            </div>
            
            {!isExplaining && (
              <button 
                className="mt-2 text-xs text-pink-500 hover:text-pink-700"
                onClick={() => setShowChat(false)}
              >
                Got it!
              </button>
            )}
            
            {/* Animated dots for explaining state */}
            {animationState === 'explaining' && (
              <div className="flex space-x-1 mt-2">
                <motion.div
                  className="w-2 h-2 bg-pink-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-pink-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-pink-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Sparkles around companion when explaining */}
      {(animationState === 'excited' || animationState === 'explaining') && (
        <div className="absolute inset-[-10px]">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-pink-300"
              style={{
                left: '50%',
                top: '50%',
              }}
              initial={{ x: 0, y: 0, opacity: 0 }}
              animate={{ 
                x: [0, (Math.random() - 0.5) * 40], 
                y: [0, (Math.random() - 0.5) * 40],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HelpCompanion;