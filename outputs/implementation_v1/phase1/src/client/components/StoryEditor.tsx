import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContentAPI, AuthAPI } from '../api-client';
import { User, ContentType } from '../types';

interface EditorState {
  title: string;
  content: string;
  description: string;
  tags: string[];
}

interface WordStats {
  words: number;
  characters: number;
  sentences: number;
  readingTime: number;
  ageGroup: string;
}

const StoryEditor: React.FC = () => {
  const { contentId } = useParams<{ contentId?: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [editorState, setEditorState] = useState<EditorState>({
    title: '',
    content: '',
    description: '',
    tags: [],
  });
  const [tagInput, setTagInput] = useState<string>('');
  const isNewStory = !contentId;

  // Calculate word stats
  const wordStats: WordStats = useMemo(() => {
    const text = editorState.content;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const characters = text.length;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    
    // Estimate reading time (average reading speed: 200 words per minute for young readers)
    const readingTime = Math.max(1, Math.round(words / 200));
    
    // Determine appropriate age group based on length and complexity
    let ageGroup = 'All ages';
    if (words > 0) {
      if (words < 50) {
        ageGroup = '3-5 years';
      } else if (words < 200) {
        ageGroup = '6-8 years';
      } else if (words < 500) {
        ageGroup = '9-12 years';
      } else {
        ageGroup = '13+ years';
      }
    }

    return { words, characters, sentences, readingTime, ageGroup };
  }, [editorState.content]);

  // Calculate progress towards story completion
  const progressInfo = useMemo(() => {
    // Target word counts for different story types
    const targetCounts = {
      short: 100,  // Short story for young children
      medium: 250, // Medium story
      long: 500    // Longer story for older children
    };
    
    const words = wordStats.words;
    let progress = {
      short: Math.min(100, Math.round((words / targetCounts.short) * 100)),
      medium: Math.min(100, Math.round((words / targetCounts.medium) * 100)),
      long: Math.min(100, Math.round((words / targetCounts.long) * 100)),
    };
    
    // Determine current story type based on progress
    let storyType = 'short';
    if (words >= targetCounts.long) {
      storyType = 'long';
    } else if (words >= targetCounts.medium) {
      storyType = 'medium';
    }
    
    // Get remaining words needed for the next milestone
    let nextMilestone = '';
    if (words < targetCounts.short) {
      nextMilestone = `${targetCounts.short - words} more words for a short story`;
    } else if (words < targetCounts.medium) {
      nextMilestone = `${targetCounts.medium - words} more words for a medium story`;
    } else if (words < targetCounts.long) {
      nextMilestone = `${targetCounts.long - words} more words for a long story`;
    } else {
      nextMilestone = 'Long story complete!';
    }
    
    return { progress, storyType, nextMilestone };
  }, [wordStats.words]);

  useEffect(() => {
    // Get current user
    const currentUser = AuthAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
      return;
    }

    // If editing existing content, load it
    if (!isNewStory) {
      loadContent();
    }
  }, [contentId]);

  const loadContent = async () => {
    if (!contentId) return;
    
    setLoading(true);
    try {
      const response = await ContentAPI.getContentById(contentId);
      const content = response.content;
      setEditorState({
        title: content.title || '',
        content: content.textContent || '',
        description: content.description || '',
        tags: content.tags || [],
      });
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load story. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditorState({
      ...editorState,
      [name]: value,
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !editorState.tags.includes(tagInput.trim())) {
      setEditorState({
        ...editorState,
        tags: [...editorState.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEditorState({
      ...editorState,
      tags: editorState.tags.filter(t => t !== tag),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editorState.title.trim() || !editorState.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (isNewStory) {
        // Create new story
        await ContentAPI.createContent({
          title: editorState.title,
          content: editorState.content,
          contentType: ContentType.Text,
          description: editorState.description,
          tags: editorState.tags,
        });
        navigate('/');
      } else {
        // Update existing story
        await ContentAPI.updateContent(contentId, {
          title: editorState.title,
          content: editorState.content,
          description: editorState.description,
          tags: editorState.tags,
        });
        navigate(`/content/${contentId}`);
      }
    } catch (err) {
      console.error('Error saving story:', err);
      setError('Failed to save story. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="story-editor">
      <header>
        <h1>{isNewStory ? 'Create New Story' : 'Edit Story'}</h1>
        <div className="editor-actions">
          <button onClick={() => navigate('/')} className="secondary-button">
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={saving || !editorState.title.trim() || !editorState.content.trim()}
          >
            {saving ? 'Saving...' : 'Save Story'}
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Story Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={editorState.title}
            onChange={handleInputChange}
            placeholder="Enter a title for your story"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            type="text"
            id="description"
            name="description"
            value={editorState.description}
            onChange={handleInputChange}
            placeholder="Brief description of your story"
          />
        </div>

        <div className="form-group">
          <div className="content-header">
            <label htmlFor="content">Story Text</label>
            <div className="word-stats">
              <span>{wordStats.words} words</span>
              <span>{wordStats.characters} characters</span>
              <span>{wordStats.sentences} sentences</span>
            </div>
          </div>
          <textarea
            id="content"
            name="content"
            value={editorState.content}
            onChange={handleInputChange}
            placeholder="Once upon a time..."
            rows={15}
            required
          />
          <div className="story-stats">
            <div className="reading-time">
              <span className="stat-label">Estimated reading time:</span>
              <span className="stat-value">{wordStats.readingTime} minute{wordStats.readingTime !== 1 ? 's' : ''}</span>
            </div>
            <div className="age-group">
              <span className="stat-label">Recommended age group:</span>
              <span className="stat-value">{wordStats.ageGroup}</span>
            </div>
          </div>
          
          <div className="story-progress">
            <h4>Story Progress</h4>
            <div className="progress-bars">
              <div className="progress-item">
                <div className="progress-label">
                  <span>Short Story</span>
                  <span>{progressInfo.progress.short}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressInfo.progress.short}%` }}></div>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-label">
                  <span>Medium Story</span>
                  <span>{progressInfo.progress.medium}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressInfo.progress.medium}%` }}></div>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-label">
                  <span>Long Story</span>
                  <span>{progressInfo.progress.long}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progressInfo.progress.long}%` }}></div>
                </div>
              </div>
            </div>
            
            <div className="next-milestone">
              <span className="milestone-info">{progressInfo.nextMilestone}</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Tags</label>
          <div className="tag-input-container">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags (press Enter)"
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button 
              type="button" 
              onClick={addTag} 
              className="tag-button"
              disabled={!tagInput.trim()}
            >
              Add
            </button>
          </div>
          <div className="tags-list">
            {editorState.tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button 
                  type="button" 
                  onClick={() => removeTag(tag)} 
                  className="remove-tag"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default StoryEditor; 