import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PublishingJob {
  id: string;
  contentId: string;
  title: string;
  type: 'story' | 'podcast' | 'video';
  formats: ('ebook' | 'pdf' | 'audio' | 'video' | 'web')[];
  channels: ('website' | 'app' | 'social' | 'email' | 'print')[];
  status: 'queued' | 'processing' | 'published' | 'failed' | 'canceled';
  createdBy: string;
  submittedAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data: PublishingJob[];
  error?: string;
  message?: string;
}

const PublishingWorkflow: React.FC = () => {
  const [jobs, setJobs] = useState<PublishingJob[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  // Fetch publishing jobs from API
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        // Get token from local storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to view publishing jobs');
          setLoading(false);
          return;
        }
        
        const response = await axios.get<ApiResponse>('http://localhost:3000/api/publishing', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setJobs(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch publishing jobs');
        }
      } catch (err) {
        setError('Error fetching publishing jobs. Please try again.');
        console.error('Publishing job fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobs();
  }, []);

  // Process a publishing job
  const handleProcessJob = async (id: string) => {
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to process publishing jobs');
        return;
      }
      
      const response = await axios.post(`http://localhost:3000/api/publishing/${id}/process`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        // Update job status in state
        setJobs(jobs.map(job => 
          job.id === id 
            ? { ...job, status: 'processing' } 
            : job
        ));
        
        // Show success message
        alert('Publishing job started successfully');
      } else {
        setError(response.data.message || 'Failed to process publishing job');
      }
    } catch (err) {
      setError('Error processing publishing job. Please try again.');
      console.error('Publishing job processing error:', err);
    }
  };

  // Delete a publishing job
  const handleDeleteJob = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this publishing job?')) {
      try {
        // Get token from local storage
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in to delete publishing jobs');
          return;
        }
        
        const response = await axios.delete(`http://localhost:3000/api/publishing/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // Remove deleted job from state
          setJobs(jobs.filter(job => job.id !== id));
        } else {
          setError(response.data.message || 'Failed to delete publishing job');
        }
      } catch (err) {
        setError('Error deleting publishing job. Please try again.');
        console.error('Publishing job deletion error:', err);
      }
    }
  };

  // Filter jobs based on status
  const filteredJobs = filter === 'all' 
    ? jobs 
    : jobs.filter(job => job.status === filter);

  return (
    <div className="publishing-workflow">
      <h2>Publishing Workflow</h2>
      <p>Manage and monitor content publishing processes.</p>
      
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
              onClick={() => setFilter('queued')}
              style={{
                backgroundColor: filter === 'queued' ? '#4a148c' : '#f1f1f1',
                color: filter === 'queued' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Queued
            </button>
            <button
              onClick={() => setFilter('processing')}
              style={{
                backgroundColor: filter === 'processing' ? '#4a148c' : '#f1f1f1',
                color: filter === 'processing' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Processing
            </button>
            <button
              onClick={() => setFilter('published')}
              style={{
                backgroundColor: filter === 'published' ? '#4a148c' : '#f1f1f1',
                color: filter === 'published' ? 'white' : 'black',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Published
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
            onClick={() => window.location.href = '/content'}
          >
            Create New Job
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading publishing jobs...
          </div>
        ) : filteredJobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No publishing jobs found. Select content from the Content Manager to publish.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f1f1' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>ID</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Title</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Status</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Submitted</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', border: '1px solid #ddd' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map(job => (
                <tr key={job.id}>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{job.id.substring(0, 8)}...</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>{job.title}</td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span style={{
                      backgroundColor: 
                        job.type === 'story' ? '#e3f2fd' : 
                        job.type === 'podcast' ? '#e8f5e9' : 
                        '#fff3e0',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    <span style={{
                      backgroundColor: 
                        job.status === 'published' ? '#e8f5e9' : 
                        job.status === 'processing' ? '#fff3e0' : 
                        job.status === 'failed' ? '#ffebee' :
                        job.status === 'canceled' ? '#efebe9' :
                        '#e3f2fd', // queued
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {new Date(job.submittedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
                    {job.status === 'queued' && (
                      <button 
                        style={{ 
                          marginRight: '0.5rem',
                          backgroundColor: '#4caf50',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleProcessJob(job.id)}
                      >
                        Process
                      </button>
                    )}
                    
                    {job.status === 'published' && (
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
                        onClick={() => window.location.href = `/publishing/result/${job.id}`}
                      >
                        View Result
                      </button>
                    )}
                    
                    {(job.status === 'queued' || job.status === 'failed') && (
                      <button 
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleDeleteJob(job.id)}
                      >
                        Delete
                      </button>
                    )}
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

export default PublishingWorkflow; 