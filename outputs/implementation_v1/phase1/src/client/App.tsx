import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthAPI } from './api-client';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import StoryEditor from './components/StoryEditor';
import ContentViewer from './components/ContentViewer';
import { User } from './types';

// Protected route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const currentUser = AuthAPI.getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{element}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!AuthAPI.getCurrentUser());

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleRegisterSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route 
            path="/login" 
            element={
              isLoggedIn 
                ? <Navigate to="/" /> 
                : <Login onLoginSuccess={handleLoginSuccess} />
            } 
          />
          <Route 
            path="/register" 
            element={
              isLoggedIn 
                ? <Navigate to="/" /> 
                : <Register onRegisterSuccess={handleRegisterSuccess} />
            } 
          />
          <Route 
            path="/create/text" 
            element={<ProtectedRoute element={<StoryEditor />} />} 
          />
          <Route 
            path="/content/:contentId" 
            element={<ProtectedRoute element={<ContentViewer />} />} 
          />
          <Route 
            path="/content/:contentId/edit" 
            element={<ProtectedRoute element={<StoryEditor />} />} 
          />
          <Route 
            path="/samples/:sampleId" 
            element={<div>Sample Viewer Coming Soon</div>} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App; 