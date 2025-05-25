import React, { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const UserManagement: React.FC = () => {
  const [users] = useState<User[]>([
    { id: '1', name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'Author' },
    { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'Editor' },
  ]);

  return (
    <div className="user-management">
      <h2>User Management</h2>
      <p>View and manage users of the Kid Book Builder platform.</p>
      
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <input
              type="text"
              placeholder="Search users..."
              style={{
                padding: '0.5rem',
                border: '1px solid #ccc',
                borderRadius: '4px',
                width: '300px'
              }}
            />
          </div>
          <button
            style={{
              backgroundColor: '#4a148c',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add New User
          </button>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f1f1' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Name</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Email</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Role</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.id}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.name}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.email}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{user.role}</td>
                <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                  <button 
                    style={{ 
                      marginRight: '0.5rem',
                      backgroundColor: '#2196f3',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    style={{
                      backgroundColor: '#f44336',
                      color: 'white',
                      border: 'none',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '2rem', color: '#666', fontStyle: 'italic' }}>
          Note: Full user management functionality will be implemented in Phase 2.
        </div>
      </div>
    </div>
  );
};

export default UserManagement; 