import React, { useEffect, useState } from 'react';
import { ContentAPI, AuthAPI } from '../api-client';
import { User, ContentMetadata, ApiError, UserRole } from '../types';

const Dashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentMetadata[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentMetadata[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    const currentUser = AuthAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load sample content
        const samplesData = await ContentAPI.getSamples();
        setSamples(samplesData.samples);
        
        // If user is logged in, fetch their content
        if (currentUser) {
          try {
            const contentData = await ContentAPI.getUserContent();
            const userContent = contentData.contents || [];
            setContent(userContent);
            setFilteredContent(userContent);
            
            // Extract unique tags
            const allTags = userContent.reduce((tags: string[], item) => {
              if (item.tags && Array.isArray(item.tags)) {
                return [...tags, ...item.tags];
              }
              return tags;
            }, []);
            setAvailableTags([...new Set(allTags)] as string[]);
          } catch (err) {
            console.error('Error fetching user content:', err);
          }
        }
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message || 'Failed to load content.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Filter content based on search term and selected tag
    if (!content.length) return;
    
    let filtered = [...content];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.title.toLowerCase().includes(term) || 
          (item.description && item.description.toLowerCase().includes(term))
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(
        item => item.tags && item.tags.includes(selectedTag)
      );
    }
    
    setFilteredContent(filtered);
  }, [searchTerm, selectedTag, content]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  };

  const handleLogout = () => {
    AuthAPI.logout();
    window.location.reload();
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedTag('');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Kid Book Builder</h1>
        {user ? (
          <div className="user-info">
            <span>Welcome, {user.displayName}!</span>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        ) : (
          <div className="login-register-buttons">
            <button onClick={() => window.location.href = '/login'}>Login</button>
            <button onClick={() => window.location.href = '/register'}>Register</button>
          </div>
        )}
      </header>

      {error && <div className="error-message">{error}</div>}

      <section className="dashboard-main">
        {user && (
          <div className="user-content">
            <h2>Your Content</h2>
            
            <div className="content-search">
              <input
                type="text"
                placeholder="Search your content..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="search-input"
              />
              {(searchTerm || selectedTag) && (
                <button onClick={handleClearFilters} className="clear-filters-button">
                  Clear Filters
                </button>
              )}
            </div>
            
            {availableTags.length > 0 && (
              <div className="tags-filter">
                <div className="tags-list">
                  {availableTags.map(tag => (
                    <span 
                      key={tag} 
                      className={`tag ${selectedTag === tag ? 'selected' : ''}`}
                      onClick={() => handleTagSelect(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {filteredContent.length === 0 ? (
              <p>
                {content.length === 0 
                  ? "You haven't created any content yet." 
                  : "No content matches your search filters."}
              </p>
            ) : (
              <div className="content-list">
                {filteredContent.map((item) => (
                  <div key={item.id} className="content-item">
                    <h3>{item.title}</h3>
                    <p>{item.description || 'No description'}</p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="content-tags">
                        {item.tags.map(tag => (
                          <span key={`${item.id}-${tag}`} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                    <div className="content-meta">
                      <span>Type: {item.contentType}</span>
                      <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="content-actions">
                      <button onClick={() => window.location.href = `/content/${item.id}`}>
                        View
                      </button>
                      <button onClick={() => window.location.href = `/content/${item.id}/edit`}>
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {user.role === UserRole.Parent && (
              <div className="create-content">
                <h3>Create New Content</h3>
                <div className="content-type-buttons">
                  <button onClick={() => window.location.href = '/create/text'}>
                    Create Story
                  </button>
                  <button onClick={() => window.location.href = '/create/audio'}>
                    Create Audio
                  </button>
                  <button onClick={() => window.location.href = '/create/image'}>
                    Upload Images
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sample-content">
          <h2>Sample Content</h2>
          <div className="content-list">
            {samples.map((item) => (
              <div key={item.id} className="content-item">
                <h3>{item.name}</h3>
                <p>Type: {item.type}</p>
                <button onClick={() => window.location.href = `/samples/${item.id}`}>
                  View Sample
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard; 