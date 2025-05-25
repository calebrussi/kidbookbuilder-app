'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect } from 'react';

/**
 * An enhanced version of the Conversation component that uses signed URLs 
 * for authentication with ElevenLabs agents.
 * 
 * To use this component instead of the basic one, replace the import in page.tsx.
 */
export function SecureConversation() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => {
      console.log('Message:', message);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: message.text }]);
    },
    onError: (error) => {
      console.error('Error:', error);
      setError('Connection error. Please try again.');
    },
  });

  const getSignedUrl = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/signed-url');
      if (!response.ok) {
        throw new Error('Failed to get signed URL');
      }
      
      const data = await response.json();
      setSignedUrl(data.signedUrl);
      return data.signedUrl;
    } catch (error) {
      console.error('Error fetching signed URL:', error);
      setError('Failed to authenticate. Please try again.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Get a signed URL for secure connection
      const url = await getSignedUrl();
      if (!url) return;
      
      // Start the conversation with the signed URL
      await conversation.startSession({ url });
      
      // Add initial message
      setMessages([{ role: 'assistant', content: 'Hello! I\'m your character creation assistant. Let\'s create a character for your story together!' }]);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError('Failed to start conversation. Please check your permissions and try again.');
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Add a user message to the conversation (for testing)
  const addUserMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'user', content: text }]);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected' || isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300 flex items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Connecting...
            </>
          ) : (
            'Start Character Creation'
          )}
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          End Conversation
        </button>
      </div>

      <div className="flex flex-col items-center">
        <p>Status: {conversation.status}</p>
        <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
      
      {/* Chat Messages */}
      <div className="w-full max-w-md mt-4 p-4 border rounded bg-white">
        <div className="flex flex-col space-y-2">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`p-2 rounded ${
                message.role === 'assistant' ? 'bg-blue-100 self-start' : 'bg-gray-100 self-end'
              }`}
            >
              {message.content}
            </div>
          ))}
        </div>
      </div>
      
      {/* Test buttons (for development only) */}
      <div className="mt-4 flex gap-2">
        <button 
          onClick={() => addUserMessage("Tell me about creating a protagonist")}
          className="px-3 py-1 bg-gray-200 rounded text-sm"
        >
          Test: Ask about protagonist
        </button>
        <button 
          onClick={() => addUserMessage("What makes a good antagonist?")}
          className="px-3 py-1 bg-gray-200 rounded text-sm"
        >
          Test: Ask about antagonist
        </button>
      </div>
    </div>
  );
}
