import React from 'react';
import { motion } from 'framer-motion';

interface AreaBackgroundProps {
  theme: string;
  position: { x: number; y: number };
  isActive: boolean;
  isCompleted: boolean;
}

const AreaBackground: React.FC<AreaBackgroundProps> = ({ 
  theme, 
  position, 
  isActive,
  isCompleted
}) => {
  // Define theme-specific background styles
  const getThemeStyles = () => {
    switch (theme) {
      case 'magical-books':
        return {
          backgroundColor: 'rgba(147, 51, 234, 0.1)',
          backgroundImage: 'url("https://images.pexels.com/photos/7232545/pexels-photo-7232545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
          borderColor: '#9333EA'
        };
      case 'fantasy-castle':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          backgroundImage: 'url("https://images.pexels.com/photos/1624440/pexels-photo-1624440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
          borderColor: '#3B82F6'
        };
      case 'character-creator':
        return {
          backgroundColor: 'rgba(249, 115, 22, 0.1)',
          backgroundImage: 'url("https://images.pexels.com/photos/2088170/pexels-photo-2088170.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
          borderColor: '#F97316'
        };
      case 'treasure-map':
        return {
          backgroundColor: 'rgba(234, 179, 8, 0.1)',
          backgroundImage: 'url("https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1")',
          borderColor: '#EAB308'
        };
      default:
        return {
          backgroundColor: 'rgba(156, 163, 175, 0.1)',
          backgroundImage: 'none',
          borderColor: '#9CA3AF'
        };
    }
  };

  const themeStyles = getThemeStyles();
  
  // Add particle effects based on theme
  const getParticles = () => {
    if (!isActive) return null;
    
    switch (theme) {
      case 'magical-books':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-purple-400"
                initial={{ 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  opacity: 0
                }}
                animate={{ 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>
        );
      case 'fantasy-castle':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-3 rounded-full bg-blue-300"
                initial={{ 
                  x: Math.random() * 300, 
                  y: 200,
                  opacity: 0
                }}
                animate={{ 
                  x: Math.random() * 300, 
                  y: 0,
                  opacity: [0, 0.7, 0],
                }}
                transition={{ 
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
        );
      case 'character-creator':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-orange-300"
                initial={{ 
                  x: 150, 
                  y: 100,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: [150, 150 + Math.random() * 100 - 50], 
                  y: [100, 100 + Math.random() * 100 - 50],
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 3
                }}
              />
            ))}
          </div>
        );
      case 'treasure-map':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-300"
                style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
                initial={{ 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  x: Math.random() * 300, 
                  y: Math.random() * 200,
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 4
                }}
              />
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      className={`absolute rounded-3xl overflow-hidden border-4 ${isCompleted ? 'border-green-500' : ''}`}
      style={{
        left: `${position.x - 50}px`,
        top: `${position.y - 50}px`,
        width: '350px',
        height: '400px',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        borderColor: isCompleted ? 'rgb(34, 197, 94)' : themeStyles.borderColor,
        backgroundImage: themeStyles.backgroundImage,
        backgroundColor: themeStyles.backgroundColor,
        zIndex: 1,
        opacity: isActive ? 1 : 0.8,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ 
        scale: isActive ? 1.05 : 1,
        opacity: isActive ? 1 : 0.8,
        boxShadow: isActive 
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' 
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 20
      }}
    >
      {/* Semi-transparent overlay to ensure content visibility */}
      <div className="absolute inset-0 bg-white/40" />
      
      {/* Particle effects based on theme */}
      {getParticles()}
      
      {/* Completed area indicator */}
      {isCompleted && (
        <motion.div 
          className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AreaBackground;