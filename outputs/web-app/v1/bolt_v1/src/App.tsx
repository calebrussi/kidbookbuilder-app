import React from 'react';
import QuestMap from './components/QuestMap';
import { WorkflowProvider } from './context/WorkflowContext';

function App() {
  return (
    <WorkflowProvider>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 overflow-hidden">
        <QuestMap />
      </div>
    </WorkflowProvider>
  );
}

export default App;