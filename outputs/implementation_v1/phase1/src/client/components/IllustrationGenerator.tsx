import React, { useState } from 'react';
import { ContentAPI } from '../api-client';

interface IllustrationGeneratorProps {
  storyText: string;
  onSaveIllustration?: (imageUrl: string, prompt: string) => void;
}

const IllustrationGenerator: React.FC<IllustrationGeneratorProps> = ({ storyText, onSaveIllustration }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  // Generate suggestions based on story text
  const generateSuggestions = () => {
    if (!storyText.trim()) {
      return [];
    }
    
    // Extract potential scene prompts from the story
    const sentences = storyText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    // Return up to 3 suggestions
    return sentences
      .slice(0, 6)
      .filter((_, index) => index % 2 === 0) // Take every other sentence to get variety
      .map(sentence => sentence.trim());
  };
  
  const suggestions = generateSuggestions();
  
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };
  
  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
    setShowSuggestions(false);
  };
  
  const handleGenerateClick = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the illustration');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await ContentAPI.generateIllustration(prompt);
      setGeneratedImage(response.imageUrl);
    } catch (err) {
      console.error('Error generating illustration:', err);
      setError('Failed to generate illustration. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveIllustration = () => {
    if (generatedImage && onSaveIllustration) {
      onSaveIllustration(generatedImage, prompt);
      
      // Reset for next generation
      setGeneratedImage(null);
      setPrompt('');
    }
  };
  
  return (
    <div className="illustration-generator">
      <h3>Generate Story Illustrations</h3>
      
      <div className="illustration-form">
        <div className="form-group">
          <label htmlFor="prompt">Describe the scene you want to illustrate:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Describe what you want in the illustration. Example: A small friendly robot meeting a little girl in a park."
            rows={4}
          />
          
          <div className="prompt-options">
            <button 
              type="button" 
              className="suggestion-toggle"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
            </button>
            
            <button
              type="button"
              className="clear-button"
              onClick={() => setPrompt('')}
              disabled={!prompt}
            >
              Clear
            </button>
          </div>
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="prompt-suggestions">
              <h4>Suggestions from your story:</h4>
              <div className="suggestions-list">
                {suggestions.map((suggestion, index) => (
                  <div 
                    key={index} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="button"
          className="generate-button"
          onClick={handleGenerateClick}
          disabled={loading || !prompt.trim()}
        >
          {loading ? 'Generating...' : 'Generate Illustration'}
        </button>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {generatedImage && (
        <div className="illustration-result">
          <h4>Generated Illustration</h4>
          <div className="illustration-preview">
            <img src={generatedImage} alt="Generated illustration" />
          </div>
          <div className="illustration-actions">
            <button 
              type="button" 
              className="save-button"
              onClick={handleSaveIllustration}
            >
              Save Illustration
            </button>
            <button 
              type="button" 
              className="try-again-button"
              onClick={() => setGeneratedImage(null)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IllustrationGenerator; 