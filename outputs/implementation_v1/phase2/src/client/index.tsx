import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// App components
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import UserManagement from './components/UserManagement';
import ContentManager from './components/ContentManager';
import PublishingWorkflow from './components/PublishingWorkflow';

// Main App component
const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <header>
          <div className="container">
            <h1>Kid Book Builder</h1>
            <nav>
              <ul style={{ display: 'flex', listStyle: 'none', gap: '20px' }}>
                <li><Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link></li>
                <li><Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>Dashboard</Link></li>
                <li><Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>Users</Link></li>
                <li><Link to="/content" style={{ color: 'white', textDecoration: 'none' }}>Content</Link></li>
                <li><Link to="/publishing" style={{ color: 'white', textDecoration: 'none' }}>Publishing</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/content" element={<ContentManager />} />
              <Route path="/publishing" element={<PublishingWorkflow />} />
            </Routes>
          </div>
        </main>
        
        <footer>
          <div className="container">
            <p>Kid Book Builder - Phase 2 Demo - {new Date().getFullYear()}</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

// Render the App
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
} 