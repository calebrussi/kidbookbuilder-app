import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>Welcome to your dashboard. This feature will be implemented in Phase 2.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <div style={{ 
          border: '1px solid #e0e0e0', 
          borderRadius: '8px',
          padding: '1.5rem',
          backgroundColor: '#f9f9f9',
          marginBottom: '1.5rem'
        }}>
          <h3>Recent Activity</h3>
          <p>Your recent activities will be displayed here.</p>
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Coming soon in Phase 2
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ 
            flex: '1 1 300px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            marginBottom: '1rem'
          }}>
            <h4>My Stories</h4>
            <p>View and manage your stories</p>
            <button style={{ 
              backgroundColor: '#4a148c', 
              color: 'white', 
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View Stories
            </button>
          </div>
          
          <div style={{ 
            flex: '1 1 300px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            marginBottom: '1rem'
          }}>
            <h4>My Media</h4>
            <p>Manage your uploaded media</p>
            <button style={{ 
              backgroundColor: '#4a148c', 
              color: 'white', 
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View Media
            </button>
          </div>
          
          <div style={{ 
            flex: '1 1 300px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '8px',
            padding: '1rem',
            backgroundColor: '#f9f9f9',
            marginBottom: '1rem'
          }}>
            <h4>Publishing Status</h4>
            <p>Check the status of your publishing jobs</p>
            <button style={{ 
              backgroundColor: '#4a148c', 
              color: 'white', 
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              View Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 