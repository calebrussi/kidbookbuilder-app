import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// App components
import Home from './components/Home';
import TemplateBuilder from './components/TemplateBuilder';
import StoryGenerator from './components/StoryGenerator';
import CollaborativeEditor from './components/CollaborativeEditor';
import MediaIntegration from './components/MediaIntegration';
import FeedbackSystem from './components/FeedbackSystem';

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
                <li><Link to="/templates" style={{ color: 'white', textDecoration: 'none' }}>Templates</Link></li>
                <li><Link to="/generator" style={{ color: 'white', textDecoration: 'none' }}>Story Generator</Link></li>
                <li><Link to="/editor" style={{ color: 'white', textDecoration: 'none' }}>Collaborative Editor</Link></li>
                <li><Link to="/media" style={{ color: 'white', textDecoration: 'none' }}>Media Tools</Link></li>
                <li><Link to="/feedback" style={{ color: 'white', textDecoration: 'none' }}>Feedback</Link></li>
              </ul>
            </nav>
          </div>
        </header>
        
        <main>
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/templates" element={<TemplateBuilder />} />
              <Route path="/generator" element={<StoryGenerator />} />
              <Route path="/editor" element={<CollaborativeEditor />} />
              <Route path="/media" element={<MediaIntegration />} />
              <Route path="/feedback" element={<FeedbackSystem />} />
            </Routes>
          </div>
        </main>
        
        <footer>
          <div className="container">
            <p>Kid Book Builder - Phase 3 Demo - {new Date().getFullYear()}</p>
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