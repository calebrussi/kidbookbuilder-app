import React from 'react';

const Home: React.FC = () => {
  return (
    <div className="home">
      <h2>Welcome to Kid Book Builder</h2>
      <p>A platform that helps parents and children create and publish stories, podcasts, and videos.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h3>Phase 2: Core Infrastructure Development</h3>
        <p>
          This phase focuses on building the core infrastructure required for the Kid Book Builder platform,
          including user management, content storage, and a publishing pipeline.
        </p>
        
        <div style={{ marginTop: '2rem', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { title: 'User Management', description: 'Authentication, profiles, and permissions' },
            { title: 'Content Storage', description: 'Secure storage for stories, media assets, and user data' },
            { title: 'Publishing Pipeline', description: 'Workflow for creating, editing, and publishing content' },
            { title: 'API Layer', description: 'RESTful endpoints for client-side interaction' }
          ].map((feature, index) => (
            <div key={index} style={{ 
              flex: '1 1 300px', 
              border: '1px solid #e0e0e0', 
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>{feature.title}</h4>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home; 