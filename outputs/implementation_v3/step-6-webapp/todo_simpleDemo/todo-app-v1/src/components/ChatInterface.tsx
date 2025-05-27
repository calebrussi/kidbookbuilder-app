
import React, { useCallback, useState, useEffect } from 'react';
import { useConversation } from '@11labs/react';
import { Mic, MicOff, MessageSquare, Phone, PhoneOff } from 'lucide-react';
import { StepWithState } from '../types/workflow';
import { UserProgress } from '../types/userProgress';

interface ChatInterfaceProps {
  currentAgentId?: string;
  currentStepId?: string;
  currentConversationId?: string;
  userProgress?: UserProgress;
  isStepInProgress?: boolean;
  firstAvailableStep?: StepWithState;
  onStepComplete?: (agentId: string) => void;
  onConversationStart?: (stepId: string, conversationId: string) => void;
  onConversationData?: (stepId: string, data: any) => void;
  onStartFirstAvailableStep?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  currentAgentId, 
  currentStepId,
  currentConversationId,
  userProgress,
  isStepInProgress = false,
  firstAvailableStep,
  onStepComplete,
  onConversationStart,
  onConversationData,
  onStartFirstAvailableStep
}) => {
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [isManuallyDisconnected, setIsManuallyDisconnected] = useState(false);
  const [lastConnectedAgentId, setLastConnectedAgentId] = useState<string | undefined>();
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  
  const conversation = useConversation({
    onConnect: (props) => {
      console.log('🎙️ ElevenLabs conversation connected');
      console.log('🔗 Connection props:', props);

      console.log('🔗 Setting conversationId from props:', props.conversationId);
      console.log('🔗 Current conversationId from prop:', currentConversationId);
      
      setIsManuallyDisconnected(false);
      setIsFirstMessage(true); // Reset first message flag
      
      // Store the agent ID that was used for this connection
      setLastConnectedAgentId(currentAgentId);
      console.log('📝 Tracking connected agent:', currentAgentId);
      
      // Initialize conversation tracking with the conversationId from props
      if (currentStepId && props.conversationId && onConversationStart) {
        console.log('🚀 Initializing conversation tracking with conversationId:', props.conversationId);
        console.log('🎯 Current step ID:', currentStepId);
        console.log('📞 Calling onConversationStart...');
        onConversationStart(currentStepId, props.conversationId);
        console.log('✅ onConversationStart called successfully');
      } else {
        console.warn('⚠️ Missing required data for conversation start:', {
          currentStepId,
          conversationId: props.conversationId,
          onConversationStart: !!onConversationStart
        });
      }
      
      // Store initial conversation data
      if (currentStepId && props.conversationId && onConversationData) {
        onConversationData(currentStepId, {
          conversationId: props.conversationId,
          startTime: new Date().toISOString()
        });
      }
    },
    onDisconnect: async () => {
      console.log('🔇 ElevenLabs conversation disconnected');

      console.log('🔗 Current Conversation ID:', currentConversationId);
      console.log('🔗 Current step ID:', currentStepId);
      console.log('📝 Last connected agent ID:', lastConnectedAgentId);
      console.log('userProgress:', userProgress);
      
      // Make API call to fetch conversation data if we have a conversationId
      if (currentConversationId) {
        try {
          console.log('📞 Fetching conversation data from API:', currentConversationId);
          const response = await fetch(`http://localhost:3001/api/conversation/${currentConversationId}`);
          
          if (response.ok) {
            const conversationData = await response.json();
            console.log('✅ Successfully fetched conversation data:', conversationData);
            
            // Update conversation data with the fetched information
            if (currentStepId && onConversationData) {
              onConversationData(currentStepId, {
                conversationId: currentConversationId,
                endTime: new Date().toISOString(),
                finalConversationData: conversationData.data
              });
            }
          } else {
            console.error('❌ Failed to fetch conversation data:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('❌ Error fetching conversation data:', error);
        }
      } else {
        console.warn('⚠️ No conversationId available to fetch conversation data');
      }
      
      // Mark step as complete when websocket closes (but not if manually disconnected)
      // The endConversation function will handle setting the endTime and messages
      // Use currentAgentId if available, fallback to lastConnectedAgentId
      // const agentToComplete = currentAgentId || lastConnectedAgentId;
      // if (agentToComplete && onStepComplete && !isManuallyDisconnected) {
      //   console.log('✅ Marking step as complete due to websocket disconnect:', {
      //     agentId: agentToComplete,
      //     currentStepId: currentStepId,
      //     wasManuallyDisconnected: isManuallyDisconnected
      //   });
      //   onStepComplete(agentToComplete);
      // } else if (isManuallyDisconnected) {
      //   console.log('⏸️ Websocket closed manually - not marking step as complete');
      // } else {
      //   console.warn('⚠️ No agent ID available to mark step complete on disconnect');
      // }
      
      setLastConnectedAgentId(undefined);
      // setCurrentConversationId(undefined);
    },
    onMessage: (message) => {
      console.log('💬 Message received:', message);

      console.log('🔗 Current Conversation ID:', currentConversationId);
      console.log('userProgress:', userProgress);
      
      const newMessage = { 
        role: message.source === 'ai' ? 'assistant' : 'user', 
        content: message.message,
        timestamp: new Date(),
        messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      
      setMessages(prevMessages => {
        const updatedMessages = [...prevMessages, newMessage];
        
        // Update conversation data with new message and current conversationId
        if (currentStepId && currentConversationId && onConversationData) {
          onConversationData(currentStepId, {
            conversationId: currentConversationId,
            messages: updatedMessages
          });
        }
        
        return updatedMessages;
      });
    },
    onError: (error) => {
      console.error('❌ ElevenLabs conversation error:', error);
    },
  });

  const startConversation = useCallback(async () => {
    // If no current agent but we have a first available step, start that step
    if (!currentAgentId && firstAvailableStep && onStartFirstAvailableStep) {
      console.log('🚀 No current agent, starting first available step:', firstAvailableStep.id);
      onStartFirstAvailableStep();
      return;
    }
    
    if (!currentAgentId) {
      console.warn('⚠️ No agent ID available for conversation');
      return;
    }

    try {
      console.log('🎯 Starting conversation with agent:', currentAgentId);
      
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with the current step's agent
      await conversation.startSession({
        agentId: currentAgentId,
      });
      
      // Clear previous messages and add initial message
      // setMessages([{ 
      //   role: 'assistant', 
      //   content: 'Hello! I\'m ready to help you with this step. Let\'s start our conversation!' 
      // }]);
      
    } catch (error) {
      console.error('❌ Failed to start conversation:', error);
      setMessages([{ 
        role: 'system', 
        content: 'Failed to start conversation. Please check your microphone permissions and try again.' 
      }]);
    }
  }, [conversation, currentAgentId, firstAvailableStep, onStartFirstAvailableStep]);

  const stopConversation = useCallback(async () => {
    console.log('🛑 Manually stopping conversation');
    setIsManuallyDisconnected(true);
    await conversation.endSession();
    setMessages([]);
  }, [conversation]);

  // Auto-stop conversation when step is no longer in progress (but don't auto-start)
  useEffect(() => {
    if (!isStepInProgress && conversation.status === 'connected' && !isManuallyDisconnected) {
      console.log('⏸️ Auto-stopping conversation as step is no longer in progress');
      conversation.endSession();
    }
  }, [isStepInProgress, conversation.status, isManuallyDisconnected, conversation]);

  const isConnected = conversation.status === 'connected';
  const hasAgentId = !!currentAgentId;
  const hasFirstAvailableStep = !!firstAvailableStep;
  const canStartChat = hasAgentId || hasFirstAvailableStep;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
      <div className="text-center space-y-6">
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isConnected 
            ? 'bg-gradient-to-br from-green-500 to-emerald-500 animate-pulse' 
            : hasAgentId 
              ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
              : 'bg-gradient-to-br from-gray-400 to-gray-500'
        }`}>
          {isConnected ? (
            conversation.isSpeaking ? (
              <Mic className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )
          ) : (
            <MicOff className="w-10 h-10 text-white" />
          )}
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-gray-800">Voice Chat Interface</h3>
          <p className="text-gray-600 text-lg leading-relaxed">
            {hasAgentId 
              ? isConnected 
                ? `Connected to agent. ${conversation.isSpeaking ? 'AI is speaking...' : 'Listening for your voice...'}`
                : 'Ready to start conversation. Click "Start Voice Chat" below.'
              : hasFirstAvailableStep
                ? `Ready to start with: "${firstAvailableStep.title}". Click "Start Voice Chat" to begin.`
                : 'No steps available to start.'
            }
          </p>
          
          {!isConnected && hasAgentId && (
            <div className="text-sm text-yellow-700 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <strong>Note:</strong> Make sure to allow microphone access when prompted for voice chat to work properly.
            </div>
          )}
          
          {currentAgentId && (
            <div className="text-sm text-gray-500 bg-blue-50 rounded-lg p-3">
              <strong>Agent ID:</strong> {currentAgentId}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className={`flex items-center justify-center gap-3 text-sm rounded-lg p-4 ${
          isConnected 
            ? 'text-green-700 bg-green-50' 
            : canStartChat 
              ? 'text-purple-700 bg-purple-50' 
              : 'text-gray-500 bg-gray-50'
        }`}>
          <MessageSquare className="w-4 h-4" />
          <span>
            Status: {isConnected ? 'Connected' : canStartChat ? 'Ready to connect' : 'No steps available'}
          </span>
        </div>

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="w-full mt-4 p-4 border rounded-lg bg-gray-50 max-h-64 overflow-y-auto">
            <div className="flex flex-col space-y-2">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg text-left ${
                    message.role === 'assistant' 
                      ? 'bg-blue-100 border-l-4 border-blue-500' 
                      : message.role === 'system'
                        ? 'bg-red-100 border-l-4 border-red-500'
                        : 'bg-gray-100 border-l-4 border-gray-500'
                  }`}
                >
                  <div className="text-xs text-gray-500 mb-1 capitalize">
                    {message.role}
                  </div>
                  <div className="text-sm">{message.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          {!isConnected ? (
            <button 
              onClick={startConversation}
              disabled={!canStartChat}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Phone className="w-4 h-4" />
              {hasAgentId ? 'Start Voice Chat' : hasFirstAvailableStep ? 'Start First Step' : 'Start Voice Chat'}
            </button>
          ) : (
            <button 
              onClick={stopConversation}
              className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
            >
              <PhoneOff className="w-4 h-4" />
              End Conversation
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
