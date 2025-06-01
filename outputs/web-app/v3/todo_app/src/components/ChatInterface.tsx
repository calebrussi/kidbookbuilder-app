import React from 'react';
import { Mic, MicOff, MessageCircle } from 'lucide-react';
import { useConversation } from '@11labs/react';
import { UserProgress, CapturedData, Message } from '../types/userProgress';
import { workflowService } from '../services/workflowService';
import { progressService } from '../services/progressService';
import { ScrollArea } from './ui/scroll-area';

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  onProgressUpdate?: (updatedProgress: UserProgress) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ progress, onCompleteStep, onProgressUpdate }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [connectionAttempts, setConnectionAttempts] = React.useState(0);
  const [lastError, setLastError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<boolean>(false);
  
  // Debug logger function
  const logDebug = React.useCallback((...args: any[]) => {
    if (debug) {
      console.log('[ChatInterface Debug]', ...args);
    }
  }, [debug]);
  
  // Toggle debug mode
  const toggleDebug = React.useCallback(() => {
    setDebug(prev => {
      const newValue = !prev;
      console.log(`Debug mode ${newValue ? 'enabled' : 'disabled'}`);
      return newValue;
    });
  }, []);
  
  // Format timestamp to local time string
  const formatTimestamp = (timestamp: Date | string): string => {
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleTimeString();
    } else if (timestamp instanceof Date) {
      return timestamp.toLocaleTimeString();
    }
    return '';
  };
  
  // Add a function to handle user speech events
  // const handleUserSpeech = React.useCallback((transcript: string) => {
  //   if (!transcript || transcript.trim() === '') return;
    
  //   console.log('User speech detected:', transcript);
    
  //   // Clean the transcript
  //   const cleanTranscript = transcript.trim();
    
  //   // Check for duplicates (avoid adding the same message multiple times)
  //   setMessages(prev => {
  //     // Check if this is a duplicate of the most recent user message
  //     const lastUserMessage = [...prev].reverse().find(msg => msg.role === 'user');
  //     if (lastUserMessage && lastUserMessage.content === cleanTranscript) {
  //       console.log('Duplicate user message detected, skipping:', cleanTranscript);
  //       return prev;
  //     }
      
  //     const userMessage: Message = {
  //       id: `user_${Date.now()}`,
  //       role: 'user',
  //       content: cleanTranscript,
  //       timestamp: new Date(),
  //       metadata: { transcribed: true }
  //     };
      
  //     const newMessages = [...prev, userMessage];
      
  //     // Save user message to progress if onProgressUpdate is available
  //     if (onProgressUpdate) {
  //       const updatedProgress = progressService.addMessage(progress, progress.currentStepId, userMessage);
  //       onProgressUpdate(updatedProgress);
  //       console.log('Saved user message to progress:', userMessage.content);
  //     }
      
  //     return newMessages;
  //   });
  // }, [progress, progress.currentStepId, onProgressUpdate]);
  
  // Add listeners for websocket messages that might contain transcription
  // React.useEffect(() => {
  //   // Function to monitor for any activity that might be transcript data
  //   const monitorForTranscript = () => {
  //     // Try to add a handler for Web Speech API results if available
  //     if ('webkitSpeechRecognition' in window) {
  //       logDebug('Web Speech API is available');
  //       // Implementation would go here if needed
  //     }
      
  //     // Monitor global window messages that might contain transcript data
  //     const handleWindowMessage = (event: MessageEvent) => {
  //       logDebug('Window message received:', event);
  //       try {
  //         if (typeof event.data === 'string') {
  //           let data;
  //           try {
  //             data = JSON.parse(event.data);
  //           } catch (e) {
  //             data = event.data;
  //           }
            
  //           // Check for a transcript in the data
  //           if (typeof data === 'string') {
  //             handleUserSpeech(data);
  //           } else if (data?.transcript || data?.text) {
  //             handleUserSpeech(data.transcript || data.text);
  //           }
  //         }
  //       } catch (error) {
  //         logDebug('Error processing window message:', error);
  //       }
  //     };
      
  //     // Monitor for any custom events that might be emitted by ElevenLabs
  //     const handleCustomEvent = (event: Event) => {
  //       logDebug('Custom event received:', event);
  //       if (event instanceof CustomEvent && event.detail) {
  //         const detail = event.detail;
  //         let transcript = '';
          
  //         // Try to extract transcript from different formats
  //         if (typeof detail === 'string') {
  //           transcript = detail;
  //         } else if (detail?.transcript) {
  //           transcript = detail.transcript;
  //         } else if (detail?.text) {
  //           transcript = detail.text;
  //         }
          
  //         if (transcript && typeof transcript === 'string' && transcript.trim() !== '') {
  //           handleUserSpeech(transcript);
  //         }
  //       }
  //     };
      
  //     // List of custom events to monitor
  //     const customEvents = [
  //       'elevenlabs:transcript',
  //       'elevenlabs:speechRecognized',
  //       'transcript',
  //       'speech'
  //     ];
      
  //     // Add window message listener
  //     window.addEventListener('message', handleWindowMessage);
      
  //     // Add custom event listeners
  //     customEvents.forEach(eventName => {
  //       window.addEventListener(eventName, handleCustomEvent);
  //     });
      
  //     return () => {
  //       // Remove window message listener
  //       window.removeEventListener('message', handleWindowMessage);
        
  //       // Remove custom event listeners
  //       customEvents.forEach(eventName => {
  //         window.removeEventListener(eventName, handleCustomEvent);
  //       });
  //     };
  //   };
    
  //   const cleanup = monitorForTranscript();
  //   return cleanup;
  // }, [handleUserSpeech, logDebug]);
  
  // Get current step data
  const currentStepData = workflowService.getStepById(progress.currentStepId);
  const currentStepProgress = progress.stepProgress[progress.currentStepId];
  const agentId = currentStepData?.step.agentId;
  const conversationId = currentStepProgress?.conversationId;

  // Initialize messages from progress if available
  // React.useEffect(() => {
  //   if (currentStepProgress?.messages) {
  //     setMessages(currentStepProgress.messages);
  //   } else {
  //     // Add initial welcome message
  //     const welcomeMessage: Message = {
  //       id: '1',
  //       role: 'assistant',
  //       content: `Hello! I'm here to help you with "${currentStepData?.step.title}". Let's get started!`,
  //       timestamp: new Date()
  //     };
  //     setMessages([welcomeMessage]);
  //   }
  // }, [progress.currentStepId, currentStepProgress?.messages, currentStepData?.step.title]);

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: (props) => {
      console.log('Connected to ElevenLabs', props);
      setIsConnecting(false);
      setConnectionAttempts(0);
      setLastError(null);

      // Update the conversation ID for the current step if available
      if (props?.conversationId && onProgressUpdate) {
        const updatedProgress = progressService.updateStepConversationId(
          progress, 
          progress.currentStepId, 
          props.conversationId
        );
        onProgressUpdate(updatedProgress);
        console.log(`Updated conversation ID for step ${progress.currentStepId}: ${props.conversationId}`);
      }
      
      const connectMessage: Message = {
        id: `connect_${Date.now()}`,
        role: 'system',
        content: `Connected to voice assistant${props?.conversationId ? ` (ID: ${props.conversationId})` : ''}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, connectMessage]);
    },
    onDisconnect: async () => {
      console.log('Disconnected from ElevenLabs');
      setIsConnecting(false);
      
      const disconnectMessage: Message = {
        id: `disconnect_${Date.now()}`,
        role: 'system',
        content: 'Disconnected from voice assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, disconnectMessage]);
    },
    onMessage: (message) => {
      console.log('Message from ElevenLabs (raw):', message);
      console.log('Message type:', typeof message);
      console.log('Message properties:', message && typeof message === 'object' ? Object.keys(message) : 'non-object');
      
      // ElevenLabs consistently returns message in the format { source: 'ai'|'user', message: string }
      // Ensure we extract message content following the expected structure
      let messageContent = '';
      let messageSource = 'ai'; // Default source
      
      // Expected structure is { source: 'ai'|'user', message: string }
      if (message && typeof message === 'object' && 'source' in message && 'message' in message) {
        // This matches the working implementation format
        messageContent = message.message;
        messageSource = message.source;
        console.log(`Message received from source: ${messageSource} with content: ${messageContent}`);
      } else if (typeof message === 'string') {
        messageContent = message;
      } else if (message && typeof message === 'object') {
        if ('message' in message) {
          messageContent = message.message;
        } else if ('content' in message) {
          messageContent = message.content;
        } else if ('text' in message) {
          messageContent = message.text;
        } else {
          // Try to stringify the message if no known properties are found
          try {
            messageContent = JSON.stringify(message);
          } catch (e) {
            messageContent = 'Received message in unknown format';
          }
        }
      }
      
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: messageSource === 'ai' ? 'assistant' : 'user', // Use the stored source value
        content: messageContent,
        timestamp: new Date(),
        metadata: { elevenlabs: true }
      };
      
      console.log('Processing message:', assistantMessage);
      console.log(`Message role determined: ${assistantMessage.role} (from source: ${messageSource})`);
      
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        
        // Save messages to progress if onProgressUpdate is available
        if (onProgressUpdate) {
          const updatedProgress = progressService.addMessage(
            progress, 
            progress.currentStepId, 
            assistantMessage
          );
          onProgressUpdate(updatedProgress);
          console.log('Saved message to progress:', assistantMessage.content);
        }
        
        return newMessages;
      });
    },
    onError: (error) => {
      console.error('ElevenLabs Error:', error);
      setIsConnecting(false);
      setLastError(typeof error === 'string' ? error : JSON.stringify(error));
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Error: ${typeof error === 'string' ? error : 'Connection failed'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  // Monitor conversation status changes for debugging
  // React.useEffect(() => {
  //   console.log('Conversation status changed:', conversation.status);
  //   console.log('Conversation speaking state:', conversation.isSpeaking);
  //   if (conversation.status === 'connected') {
  //     console.log('Conversation is connected and ready to receive messages');
  //   }
  // }, [conversation.status, conversation.isSpeaking]);

  const startConversation = React.useCallback(async () => {
    if (!agentId) {
      console.error('No agent ID found for current step');
      setLastError('No agent ID configured for this step');
      return;
    }

    // // Check if API key is available
    // const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    // if (!apiKey || apiKey === 'your_api_key_here') {
    //   const errorMsg = 'ElevenLabs API key not configured. Please add VITE_ELEVENLABS_API_KEY to your .env file.';
    //   console.error(errorMsg);
    //   setLastError(errorMsg);
    //   const errorMessage: Message = {
    //     id: `error_${Date.now()}`,
    //     role: 'system',
    //     content: errorMsg,
    //     timestamp: new Date()
    //   };
    //   setMessages(prev => [...prev, errorMessage]);
    //   return;
    // }

    setIsConnecting(true);
    setConnectionAttempts(prev => prev + 1);
    setLastError(null);

    try {
      console.log(`Starting conversation with agent: ${agentId}`);
      console.log('Connection attempt:', connectionAttempts);
      
      // Request microphone permission with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      console.log('Microphone permission granted, stream:', stream);
      
      // Start the conversation with the step's agent
      await conversation.startSession({
        agentId: agentId,
        // Add context about the current step
        ...(currentStepData && {
          context: `The user is currently working on step: "${currentStepData.step.title}".`
        }),
        // Resume existing conversation if available
        ...(conversationId && { conversationId })
      });
      
      console.log('Conversation session started successfully');
      
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setIsConnecting(false);
      setLastError(error instanceof Error ? error.message : 'Failed to start conversation');
      
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        role: 'system',
        content: `Failed to start conversation: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your microphone permissions and API key.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  }, [conversation, agentId, connectionAttempts]);

  const stopConversation = React.useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Failed to stop conversation:', error);
    }
  }, [conversation]);

  const toggleListening = () => {
    if (conversation.status === 'connected') {
      stopConversation();
    } else {
      startConversation();
    }
  };
  
  // Extract captured data from the conversation based on the current step
  const extractCapturedData = React.useCallback((): CapturedData[] => {
    // This implementation can be expanded based on specific requirements
    const userMessages = messages.filter(msg => msg.role === 'user');
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    
    if (!currentStepData || userMessages.length === 0) return [];
    
    const capturedData: CapturedData[] = [];
    
    // Basic implementation - extract the last user message as the captured response
    if (userMessages.length > 0) {
      capturedData.push({
        label: `Answer to: ${currentStepData.step.title}`,
        value: userMessages[userMessages.length - 1].content,
        timestamp: new Date()
      });
    }
    
    // Add more logic here to extract specific data based on the current step
    // For example, extract specific keywords or entities from user messages
    
    return capturedData;
  }, [messages, currentStepData]);
  
  // Add a complete button to manually complete the current step
  const handleCompleteStep = () => {
    // Extract captured data from the conversation
    const data = extractCapturedData();
    
    // Complete the current step with the captured data
    onCompleteStep(data);
    
    // If the conversation is active, stop it
    if (conversation.status === 'connected') {
      stopConversation();
    }
  };

  // Test message handling
  const simulateAssistantMessage = () => {
    const testMessage: Message = {
      id: `test_${Date.now()}`,
      role: 'assistant',
      content: `This is a test message from the assistant. The current step is: ${currentStepData?.step.title}`,
      timestamp: new Date(),
      metadata: { test: true }
    };
    
    setMessages(prev => [...prev, testMessage]);
    
    // Also save to progress if onProgressUpdate is available
    if (onProgressUpdate) {
      const updatedProgress = progressService.addMessage(
        progress, 
        progress.currentStepId, 
        testMessage
      );
      onProgressUpdate(updatedProgress);
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

        {currentStepData && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Current Step:
            </p>
            <p className="text-purple-800">
              {currentStepData.step.title}
            </p>
            <p className="text-xs text-purple-500 mt-1">
              Status: {conversation.status} | Agent: {conversation.isSpeaking ? 'speaking' : 'listening'}
            </p>
            {agentId && (
              <p className="text-xs text-gray-500 mt-1">
                Agent ID: {agentId}
              </p>
            )}
            {conversationId && (
              <p className="text-xs text-gray-500 mt-1">
                Conversation ID: {conversationId}
              </p>
            )}
          </div>
        )}

        {/* Connection Status and Errors */}
        {isConnecting && (
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600">
              🔄 Connecting to voice assistant... (Attempt {connectionAttempts})
            </p>
          </div>
        )}

        {lastError && (
          <div className="bg-red-50 rounded-lg p-3">
            <p className="text-sm text-red-600 font-medium">❌ Error:</p>
            <p className="text-xs text-red-500 mt-1">{lastError}</p>
            {connectionAttempts >= 3 && (
              <button
                onClick={() => {
                  setConnectionAttempts(0);
                  setLastError(null);
                  startConversation();
                }}
                className="mt-2 text-xs bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Retry Connection
              </button>
            )}
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
                className={`flex ${message.role === 'assistant' || message.role === 'system' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-purple-500 text-white'
                      : message.role === 'system'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' 
                      ? 'text-purple-200' 
                      : message.role === 'system'
                      ? 'text-yellow-600'
                      : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Voice Interface */}
      <div className="text-center space-y-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleListening}
            disabled={!agentId}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center
              transition-all duration-200 transform hover:scale-105
              ${conversation.status === 'connected'
                ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                : 'bg-purple-500 hover:bg-purple-600'
              }
              ${!agentId ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {conversation.status === 'connected' ? (
              <MicOff className="w-6 h-6 text-white" />
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>
          
          <button 
            onClick={handleCompleteStep}
            disabled={currentStepProgress?.status === 'complete' || !messages.some(m => m.role === 'user')}
            className={`
              bg-green-500 hover:bg-green-600 text-white 
              px-6 py-2 rounded-lg transition-colors
              ${(currentStepProgress?.status === 'complete' || !messages.some(m => m.role === 'user')) 
                ? 'opacity-50 cursor-not-allowed' 
                : ''
              }
            `}
          >
            Complete Step
          </button>
        </div>

        <p className="text-sm text-gray-500">
          {!agentId 
            ? 'No agent available for this step'
            : conversation.status === 'connected' 
            ? 'Connected - Click to stop' 
            : 'Click to start voice conversation'
          }
        </p>

        {/* Debugging Controls (hidden in production) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-4 space-x-2">
            <button
              onClick={toggleDebug}
              className="text-xs bg-gray-200 text-gray-800 px-3 py-1 rounded hover:bg-gray-300"
            >
              {debug ? 'Disable Debug' : 'Enable Debug'}
            </button>
            <button
              onClick={simulateAssistantMessage}
              className="text-xs bg-blue-200 text-blue-800 px-3 py-1 rounded hover:bg-blue-300"
            >
              Test Assistant Message
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
