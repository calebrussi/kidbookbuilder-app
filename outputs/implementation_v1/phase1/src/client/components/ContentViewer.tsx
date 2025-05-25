import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ContentAPI, AuthAPI } from '../api-client';
import { ContentMetadata, ContentType, User } from '../types';
import IllustrationGenerator from './IllustrationGenerator';

interface ContentData {
  metadata: ContentMetadata;
  content?: string;
}

interface TextToSpeechState {
  isPlaying: boolean;
  isPaused: boolean;
  currentPosition: number;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  rate: number;
  pitch: number;
}

interface SavedIllustration {
  imageUrl: string;
  prompt: string;
}

const ContentViewer: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [content, setContent] = useState<ContentData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Text-to-speech state
  const [ttsState, setTtsState] = useState<TextToSpeechState>({
    isPlaying: false,
    isPaused: false,
    currentPosition: 0,
    availableVoices: [],
    selectedVoice: null,
    rate: 1,
    pitch: 1
  });
  
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [savedIllustrations, setSavedIllustrations] = useState<SavedIllustration[]>([]);
  const [showIllustrationGenerator, setShowIllustrationGenerator] = useState<boolean>(false);

  useEffect(() => {
    const currentUser = AuthAPI.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }

    loadContent();
    
    // Initialize speech synthesis
    initSpeechSynthesis();
    
    // Cleanup
    return () => {
      stopSpeaking();
    };
  }, [contentId]);
  
  const initSpeechSynthesis = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Get available voices
      const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setTtsState(prev => ({
          ...prev,
          availableVoices: voices,
          // Prefer an English voice if available
          selectedVoice: prev.selectedVoice || 
            voices.find(voice => voice.lang.includes('en') && voice.name.includes('Female')) || 
            voices[0] || null
        }));
      };
      
      // Firefox loads voices immediately, Chrome loads them asynchronously
      getVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }
    }
  };

  const loadContent = async () => {
    if (!contentId) {
      setError('Content ID is missing');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get content metadata
      const response = await ContentAPI.getContentById(contentId);
      const metadata = response.content;

      // For text content, fetch the actual file content
      let textContent = '';
      if (metadata.contentType === ContentType.Text) {
        try {
          const fileResponse = await fetch(`http://localhost:3000/api/content/${contentId}/file`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (fileResponse.ok) {
            textContent = await fileResponse.text();
          }
        } catch (fileErr) {
          console.error('Error fetching text content:', fileErr);
        }
      }

      setContent({
        metadata,
        content: textContent
      });
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/content/${contentId}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      await ContentAPI.deleteContent(contentId);
      navigate('/');
    } catch (err) {
      console.error('Error deleting content:', err);
      setError('Failed to delete content. Please try again.');
    }
  };
  
  // Text-to-speech functions
  const startSpeaking = () => {
    if (!content?.content || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    stopSpeaking();
    
    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(content.content);
    
    if (ttsState.selectedVoice) {
      utterance.voice = ttsState.selectedVoice;
    }
    
    utterance.rate = ttsState.rate;
    utterance.pitch = ttsState.pitch;
    
    // Events
    utterance.onend = () => {
      setTtsState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentPosition: 0
      }));
    };
    
    utterance.onpause = () => {
      setTtsState(prev => ({
        ...prev,
        isPaused: true
      }));
    };
    
    utterance.onresume = () => {
      setTtsState(prev => ({
        ...prev,
        isPaused: false
      }));
    };
    
    // Start speaking
    window.speechSynthesis.speak(utterance);
    utteranceRef.current = utterance;
    
    setTtsState(prev => ({
      ...prev,
      isPlaying: true,
      isPaused: false
    }));
  };
  
  const pauseSpeaking = () => {
    if (window.speechSynthesis && ttsState.isPlaying) {
      window.speechSynthesis.pause();
      setTtsState(prev => ({
        ...prev,
        isPaused: true
      }));
    }
  };
  
  const resumeSpeaking = () => {
    if (window.speechSynthesis && ttsState.isPaused) {
      window.speechSynthesis.resume();
      setTtsState(prev => ({
        ...prev,
        isPaused: false
      }));
    }
  };
  
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setTtsState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        currentPosition: 0
      }));
    }
  };
  
  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceIndex = parseInt(e.target.value);
    setTtsState(prev => ({
      ...prev,
      selectedVoice: prev.availableVoices[voiceIndex] || null
    }));
  };
  
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setTtsState(prev => ({
      ...prev,
      rate
    }));
  };
  
  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pitch = parseFloat(e.target.value);
    setTtsState(prev => ({
      ...prev,
      pitch
    }));
  };

  const handleSaveIllustration = (imageUrl: string, prompt: string) => {
    setSavedIllustrations(prev => [...prev, { imageUrl, prompt }]);
  };

  const renderContent = () => {
    if (!content) return null;

    const { metadata } = content;

    switch (metadata.contentType) {
      case ContentType.Text:
        return (
          <div className="text-content">
            <div className="story-text" ref={contentRef}>
              {content.content ? (
                <div>{content.content.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}</div>
              ) : (
                <p>No content available</p>
              )}
            </div>
            
            {content.content && (
              <div className="text-to-speech-controls">
                <h3>Text-to-Speech</h3>
                
                <div className="tts-playback-controls">
                  {!ttsState.isPlaying ? (
                    <button 
                      onClick={startSpeaking}
                      className="tts-button play-button"
                    >
                      <span>🔊</span> Read Aloud
                    </button>
                  ) : ttsState.isPaused ? (
                    <button 
                      onClick={resumeSpeaking}
                      className="tts-button resume-button"
                    >
                      <span>▶️</span> Resume
                    </button>
                  ) : (
                    <button 
                      onClick={pauseSpeaking}
                      className="tts-button pause-button"
                    >
                      <span>⏸️</span> Pause
                    </button>
                  )}
                  
                  {ttsState.isPlaying && (
                    <button 
                      onClick={stopSpeaking}
                      className="tts-button stop-button"
                    >
                      <span>⏹️</span> Stop
                    </button>
                  )}
                </div>
                
                <div className="tts-settings">
                  <div className="tts-setting">
                    <label>Voice:</label>
                    <select 
                      value={ttsState.availableVoices.indexOf(ttsState.selectedVoice as SpeechSynthesisVoice)}
                      onChange={handleVoiceChange}
                      disabled={ttsState.isPlaying}
                    >
                      {ttsState.availableVoices.map((voice, index) => (
                        <option key={voice.name} value={index}>
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="tts-setting">
                    <label>Speed: {ttsState.rate.toFixed(1)}x</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={ttsState.rate}
                      onChange={handleRateChange}
                      disabled={ttsState.isPlaying}
                    />
                  </div>
                  
                  <div className="tts-setting">
                    <label>Pitch: {ttsState.pitch.toFixed(1)}</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={ttsState.pitch}
                      onChange={handlePitchChange}
                      disabled={ttsState.isPlaying}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Illustrations section */}
            {isOwner && content.content && (
              <div className="illustrations-section">
                <div className="illustrations-header">
                  <h3>Story Illustrations</h3>
                  <button 
                    className="toggle-illustration-generator"
                    onClick={() => setShowIllustrationGenerator(!showIllustrationGenerator)}
                  >
                    {showIllustrationGenerator ? 'Hide Generator' : 'Generate New Illustration'}
                  </button>
                </div>
                
                {showIllustrationGenerator && (
                  <IllustrationGenerator 
                    storyText={content.content} 
                    onSaveIllustration={handleSaveIllustration}
                  />
                )}
                
                {savedIllustrations.length > 0 && (
                  <div className="saved-illustrations">
                    <h4>Your Illustrations</h4>
                    <div className="illustrations-grid">
                      {savedIllustrations.map((illustration, index) => (
                        <div key={index} className="illustration-card">
                          <img src={illustration.imageUrl} alt={`Illustration ${index + 1}`} />
                          <div className="illustration-caption">
                            <p>{illustration.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case ContentType.Image:
        return (
          <div className="image-content">
            <img 
              src={`http://localhost:3000/api/content/${contentId}/file`} 
              alt={metadata.title} 
              className="content-image" 
            />
          </div>
        );
      
      case ContentType.Audio:
        return (
          <div className="audio-content">
            <audio 
              controls 
              src={`http://localhost:3000/api/content/${contentId}/file`}
              className="audio-player"
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );
      
      default:
        return <p>This content type cannot be previewed.</p>;
    }
  };

  if (loading) {
    return <div className="content-loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="content-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="content-not-found">
        <h2>Content Not Found</h2>
        <p>The requested content could not be found.</p>
        <button onClick={() => navigate('/')}>Return to Dashboard</button>
      </div>
    );
  }

  const { metadata } = content;
  const isOwner = user && user.id === metadata.authorId;

  return (
    <div className="content-viewer">
      <header className="content-header">
        <div>
          <h1>{metadata.title}</h1>
          <div className="content-meta">
            <span>By {metadata.authorName}</span>
            <span>Created {new Date(metadata.createdAt).toLocaleDateString()}</span>
            <span>Type: {metadata.contentType}</span>
          </div>
          {metadata.description && (
            <p className="content-description">{metadata.description}</p>
          )}
          {metadata.tags && metadata.tags.length > 0 && (
            <div className="content-tags">
              {metadata.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
        <div className="content-actions">
          <button onClick={() => navigate('/')} className="secondary-button">
            Back
          </button>
          {isOwner && (
            <>
              <button onClick={handleEdit} className="edit-button">
                Edit
              </button>
              <button onClick={handleDelete} className="delete-button">
                Delete
              </button>
            </>
          )}
        </div>
      </header>

      <div className="content-body">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentViewer; 