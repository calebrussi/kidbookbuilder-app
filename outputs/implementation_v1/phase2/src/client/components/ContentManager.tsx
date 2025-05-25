import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Content {
  id: string;
  title: string;
  type: 'story' | 'podcast' | 'video';
  description: string;
  authorId: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: Content[];
  error?: string;
  message?: string;
}

const ContentManager: React.FC = () => {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  // Fetch content from API
  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        // Get token from local storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to view content');
          setLoading(false);
          return;
        }
        
        const response = await axios.get<ApiResponse>('http://localhost:3000/api/content', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setContents(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch content');
        }
      } catch (err) {
        setError('Error fetching content. Please try again.');
        console.error('Content fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, []);
  
  // Handle content deletion
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        // Get token from local storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to delete content');
          return;
        }
        
        const response = await axios.delete(`http://localhost:3000/api/content/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Remove deleted content from state
          setContents(contents.filter(content => content.id !== id));
        } else {
          setError(response.data.message || 'Failed to delete content');
        }
      } catch (err) {
        setError('Error deleting content. Please try again.');
        console.error('Content deletion error:', err);
      }
    }
  };

  // Filter content based on selected type
  const filteredContent = filter === 'all' 
    ? contents 
    : contents.filter(content => content.type === filter);

  return (
    <div className="content-manager">
      <h2>Content Management</h2>
      <p>Create, view, and manage content.</p>
      
      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#b71c1c', 
          padding: '0.75rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <button
              onClick={() => setFilter('all')}
              style={{
                backgroundColor: filter === 'all' ? '#4a148c' : '#f1f1f1',
                color: filter === 'all' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              All
            </button>
            <button
              onClick={() => setFilter('story')}
              style={{
                backgroundColor: filter === 'story' ? '#4a148c' : '#f1f1f1',
                color: filter === 'story' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Stories
            </button>
            <button
              onClick={() => setFilter('podcast')}
              style={{
                backgroundColor: filter === 'podcast' ? '#4a148c' : '#f1f1f1',
                color: filter === 'podcast' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Podcasts
            </button>
            <button
              onClick={() => setFilter('video')}
              style={{
                backgroundColor: filter === 'video' ? '#4a148c' : '#f1f1f1',
                color: filter === 'video' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Videos
            </button>
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
            onClick={() => window.location.href = '/content/new'}
          >
            Create New Content
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading content...
          </div>
        ) : filteredContent.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No content found. Click "Create New Content" to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f1f1' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Created</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map(content => (
                <tr key={content.id}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{content.id.substring(0, 8)}...</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{content.title}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span style={{
                      backgroundColor: 
                        content.type === 'story' ? '#e3f2fd' : 
                        content.type === 'podcast' ? '#e8f5e9' : 
                        '#fff3e0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {content.type.charAt(0).toUpperCase() + content.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span style={{
                      backgroundColor: 
                        content.status === 'published' ? '#e8f5e9' : 
                        content.status === 'review' ? '#fff3e0' : 
                        content.status === 'archived' ? '#efebe9' :
                        '#ffebee',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {content.status.charAt(0).toUpperCase() + content.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {new Date(content.createdAt).toLocaleDateString()}
                  </td>
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
                      onClick={() => window.location.href = `/content/edit/${content.id}`}
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
                      onClick={() => handleDelete(content.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ContentManager; 