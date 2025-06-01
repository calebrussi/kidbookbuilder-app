
import React from 'react';
import { Mic, MicOff, MessageCircle } from 'lucide-react';
import { UserProgress, CapturedData } from '../types/userProgress';
import { ScrollArea } from './ui/scroll-area';

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  isBot: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ progress, onCompleteStep }) => {
  const [isListening, setIsListening] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m here to help you complete your character creation quiz. Let\'s start with the first step.',
      timestamp: new Date(),
      isBot: true
    }
  ]);
  
  const currentStepProgress = progress.stepProgress[progress.currentStepId];
  const currentStepTitle = currentStepProgress ? 
    Object.values(progress.stepProgress).find(sp => sp.stepId === progress.currentStepId)?.stepId : '';

  const toggleListening = () => {
    setIsListening(!isListening);
    
    // Simulate bot message when starting to listen
    if (!isListening) {
      setTimeout(() => {
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          content: 'I\'m listening! Please tell me about your preferences for this step.',
          timestamp: new Date(),
          isBot: true
        };
        setMessages(prev => [...prev, newMessage]);
      }, 1000);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="text-center space-y-4 mb-6">
        <div className="space-y-2">
          <MessageCircle className="w-12 h-12 text-purple-500 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-900">
            Voice Chat Interface
          </h3>
          <p className="text-gray-600">
            Speak with your AI assistant to complete the current step
          </p>
        </div>

        {currentStepProgress && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Current Step:
            </p>
            <p className="text-purple-800">
              {currentStepTitle}
            </p>
          </div>
        )}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation</h4>
        <ScrollArea className="h-64 border border-gray-200 rounded-lg">
          <div className="p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.isBot
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-purple-500 text-white'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.isBot ? 'text-gray-500' : 'text-purple-200'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Voice Interface */}
      <div className="text-center space-y-4">
        <button
          onClick={toggleListening}
          className={`
            w-24 h-24 rounded-full flex items-center justify-center mx-auto
            transition-all duration-200 transform hover:scale-105
            ${isListening 
              ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
              : 'bg-purple-500 hover:bg-purple-600'
            }
          `}
        >
          {isListening ? (
            <MicOff className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>

        <p className="text-sm text-gray-500">
          {isListening ? 'Listening... Click to stop' : 'Click to start speaking'}
        </p>
      </div>
    </div>
  );
};
