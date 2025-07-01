import React from 'react';
import { useAuth } from '../context/AuthContext';

export const UserProfile: React.FC = () => {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-3 mb-4">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-semibold">
            {user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            {user.user_metadata?.full_name || user.email}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
      </div>
      
      <button
        onClick={handleSignOut}
        className="text-xs text-gray-500 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
      >
        Sign out
      </button>
    </div>
  );
};
