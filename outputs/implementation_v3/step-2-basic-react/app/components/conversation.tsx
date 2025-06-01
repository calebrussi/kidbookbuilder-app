'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState } from 'react';

export function Conversation() {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message) => {
      console.log('Message:', message);
      setMessages(prevMessages => [...prevMessages, { role: 'assistant', content: message.text }]);
    },
    onError: (error) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with your agent
      await conversation.startSession({
        agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'YOUR_AGENT_ID', // Replace with your agent ID
      });
      
      // Add initial message
      setMessages([{ role: 'assistant', content: 'Hello! I\'m your character creation assistant. Let\'s create a character for your story together!' }]);
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Character Creation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
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
    </div>
  );
}
