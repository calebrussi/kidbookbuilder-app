import React from 'react';
import { useAuth } from '../context/AuthContext';
import { SupabaseProgressService } from '../services/supabaseProgressService';

interface ProgressDebugPanelProps {
  progress: any;
  isRealtimeConnected: boolean;
}

export const ProgressDebugPanel: React.FC<ProgressDebugPanelProps> = ({ 
  progress, 
  isRealtimeConnected 
}) => {
  const { user } = useAuth();

  const handleTestSave = async () => {
    if (!user?.id || !progress) {
      console.log('❌ No user or progress to save');
      return;
    }

    console.log('🧪 Testing manual save to Supabase...');
    const success = await SupabaseProgressService.saveUserProgress(user.id, progress);
    console.log(success ? '✅ Test save successful' : '❌ Test save failed');
  };

  const handleTestLoad = async () => {
    if (!user?.id) {
      console.log('❌ No user to load for');
      return;
    }

    console.log('🧪 Testing manual load from Supabase...');
    const loadedProgress = await SupabaseProgressService.loadUserProgress(
      user.id, 
      'character-creation-quiz'
    );
    console.log(loadedProgress ? '✅ Test load successful' : '❌ Test load failed');
    console.log('📊 Loaded progress:', loadedProgress);
  };

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm">
      <h3 className="text-sm font-bold mb-2">🔧 Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>User:</strong> {user?.email || 'Not signed in'}
        </div>
        <div>
          <strong>Real-time:</strong> 
          <span className={isRealtimeConnected ? 'text-green-400' : 'text-red-400'}>
            {isRealtimeConnected ? ' Connected' : ' Disconnected'}
          </span>
        </div>
        <div>
          <strong>Progress:</strong> {progress ? 'Loaded' : 'None'}
        </div>
        
        {user && (
          <div className="space-y-1 pt-2 border-t border-gray-600">
            <button
              onClick={handleTestSave}
              className="w-full bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
            >
              Test Save to Supabase
            </button>
            <button
              onClick={handleTestLoad}
              className="w-full bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              Test Load from Supabase
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
