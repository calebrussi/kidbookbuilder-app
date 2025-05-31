
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface DebugContextType {
  showDebug: boolean;
  toggleDebug: () => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export const DebugProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showDebug, setShowDebug] = useState(false);

  const toggleDebug = () => {
    setShowDebug(prevShowDebug => !prevShowDebug);
  };

  return (
    <DebugContext.Provider value={{ showDebug, toggleDebug }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = (): DebugContextType => {
  const context = useContext(DebugContext);
  if (context === undefined) {
    throw new Error('useDebug must be used within a DebugProvider');
  }
  return context;
};
