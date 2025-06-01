import React from 'react';
import { Mic, MicOff, MessageCircle, AlertCircle } from 'lucide-react';
import { UserProgress, CapturedData } from '../types/userProgress';
import { ScrollArea } from './ui/scroll-area';
import {
  useElevenLabsConversation,
  ElevenLabsMessage,
} from "../hooks/useElevenLabsConversation";
import { progressService } from "../services/progressService";
import { processingService } from "../services/processingService";
import { useDebug } from '../context/debugContext'; // Add this import

interface ChatInterfaceProps {
  progress: UserProgress;
  onCompleteStep: (capturedData?: CapturedData[]) => void;
  agentId?: string;
  onConversationIdUpdate?: (stepId: string, conversationId: string) => void;
  onConversationProgressUpdate?: (stepId: string, progressData: any) => void; // Added new prop
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  progress, 
  onCompleteStep,
  agentId,
  onConversationIdUpdate,
  onConversationProgressUpdate
}) => {
  const prevStepIdRef = React.useRef<string>(progress.currentStepId);
  const stepProgress = progress.stepProgress[progress.currentStepId];
  const stepTitle = stepProgress ?
    Object.values(progress.stepProgress).find(sp => sp.stepId === progress.currentStepId)?.stepId : '';
  
  // Add state tracking for current progress
  const [currentProgress, setCurrentProgress] = React.useState(progress);

  React.useEffect(() => {
    setCurrentProgress(progress);
  }, [progress]);

  // Get the agent ID for the current step
  const getCurrentStepAgentId = () => {
    // Use the agent ID passed as prop, or fall back to environment variable
    return agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;
  };

  // Get the conversation ID for the current step
  const getCurrentStepConversationId = () => {
    return currentProgress.stepProgress[currentProgress.currentStepId]?.conversationId;
  };

  const {
    isLoading,
    error,
    startConversation,
    stopConversation,
    addUserMessage,
    status,
    isSpeaking
  } = useElevenLabsConversation({
    agentId: getCurrentStepAgentId(),
    onMessage: (message: ElevenLabsMessage) => {
      console.log('Chat interface received message:', message);
      
      // Only process assistant messages here (user messages are handled in the sendMessage function)
      if (message.isBot && currentProgress) {
        // Save the assistant message to the user's progress
        const updatedProgress = progressService.addMessage(
          currentProgress,
          currentProgress.currentStepId,
          {
            content: message.content,
            role: message.source,
          }
        );

        // Update the current progress state
        setCurrentProgress(updatedProgress);

        // If we have access to storage service, update the progress there too
        if (onConversationIdUpdate) {
          onConversationIdUpdate(
            updatedProgress.currentStepId,
            updatedProgress.stepProgress[updatedProgress.currentStepId]
              .conversationId
          );
        }
      }
    },
    onConnect: (props) => {
      console.log('Chat interface: ElevenLabs connected', props);
      
      // Generate a conversation ID and update the progress when connected
      if (onConversationIdUpdate && progress && props) {
        onConversationIdUpdate(progress.currentStepId, props.conversationId);
      }
    },
    onDisconnect: () => {
      console.log("Chat interface: ElevenLabs disconnected");

      // Get the conversation ID from the current progress
      if (
        currentProgress &&
        currentProgress.stepProgress[currentProgress.currentStepId] &&
        currentProgress.stepProgress[currentProgress.currentStepId].conversationId
      ) {
        const conversationId =
          currentProgress.stepProgress[currentProgress.currentStepId]
            .conversationId;
        console.log(
          "Chat interface: Fetching conversation data for ID:",
          conversationId
        );

        // Use the processingService to fetch and update conversation data
        processingService
          .fetchConversationAndUpdateProgress(
            conversationId,
            currentProgress,
            {
              onConversationIdUpdate,
              onConversationProgressUpdate
            }
          )
          .then(updatedProgress => {
            if (updatedProgress) {
              console.log("Updated progress after conversation fetch:", updatedProgress);
              // Update the local state
              setCurrentProgress(updatedProgress);
            }
          })
          .catch((error) => {
            console.error("Error fetching conversation data:", error);
          });
      }
    },
    onError: (error: string) => {
      console.error('Chat interface: ElevenLabs error:', error);
    }
  });

  React.useEffect(() => {
    // Check if the step has actually changed
    if (prevStepIdRef.current !== progress.currentStepId) {
      console.log(
        `ChatInterface: Step changed from ${prevStepIdRef.current} to ${progress.currentStepId}.`
      );
      // If a conversation is currently active (from the previous step), stop it.
      if (status === 'connected') {
        console.log('ChatInterface: Stopping active conversation due to step change.');
        stopConversation(); // Call the function from the hook
      }
      // Update the ref to the new current step ID for the next comparison
      prevStepIdRef.current = progress.currentStepId;
    }
  }, [progress.currentStepId, status, stopConversation]);

  const handleStartConversation = async () => {
    await startConversation(getCurrentStepAgentId());
  };

  const handleStopConversation = async () => {
    await stopConversation();
  };

  // Add sendUserMessage function
  const sendUserMessage = (content: string) => {
    if (!content.trim() || !isConnected) return;

    // Use the addUserMessage from ElevenLabs hook to add the message to the UI
    const message = addUserMessage(content);

    // Save the user message to progress
    if (currentProgress) {
      const updatedProgress = progressService.addMessage(
        currentProgress,
        currentProgress.currentStepId,
        {
          content: content,
          role: "user",
        }
      );

      setCurrentProgress(updatedProgress);

      // If we have a way to update the conversation ID, use it
      if (onConversationIdUpdate) {
        onConversationIdUpdate(
          updatedProgress.currentStepId,
          updatedProgress.stepProgress[updatedProgress.currentStepId]
            .conversationId
        );
      }
    }
  };

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting' || isLoading;
  const { showDebug } = useDebug(); // Add this line

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

        {/* {stepProgress && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm text-purple-600 font-medium">
              Current Step:
            </p>
            <p className="text-purple-800">
              {stepTitle}
            </p>
          </div>
        )} */}

        {/* Connection Status */}
        {/* <div className={`flex items-center justify-center gap-2 text-sm ${
          isConnected ? 'text-green-600' : error ? 'text-red-600' : 'text-gray-500'
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : error ? 'bg-red-500' : 'bg-gray-400'
          }`}></div>
          <span>
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : error ? 'Disconnected' : 'Ready to connect'}
          </span>
          {isSpeaking && <span className="text-blue-600">(Speaking)</span>}
        </div> */}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Chat Messages Window */}
      <div className="flex-1 mb-6">
        {/* <h4 className="text-sm font-medium text-gray-700 mb-3">Conversation</h4> */}
        <ScrollArea className="h-64 border border-gray-200 rounded-lg">
          <div className="p-4 space-y-3">
            {/* Derive messagesToDisplay from currentProgress */}
            {(currentProgress.stepProgress[currentProgress.currentStepId]?.messages || []).length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No messages yet. Start a conversation to begin!</p>
              </div>
            ) : (
              (currentProgress.stepProgress[currentProgress.currentStepId]?.messages || []).map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'ai'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-purple-500 text-white'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'ai' ? 'text-gray-500' : 'text-purple-200'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Voice Interface */}
      <div className="text-center space-y-4">
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleStartConversation}
            disabled={isConnected || isConnecting}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300
                     text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {isConnecting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Start Conversation
          </button>

          <button
            onClick={handleStopConversation}
            disabled={!isConnected}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300
                     text-white rounded-lg transition-colors"
          >
            Stop Conversation
          </button>
        </div>

        <div className="relative">
          <button
            disabled={!isConnected}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center mx-auto
              transition-all duration-200 transform hover:scale-105 disabled:opacity-50
              ${isConnected && isSpeaking
                ? 'bg-blue-500 hover:bg-blue-600 animate-pulse shadow-lg'
                : isConnected
                ? 'bg-purple-500 hover:bg-purple-600 shadow-md'
                : 'bg-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isConnected && isSpeaking ? (
              <div className="flex items-center justify-center">
                <div className="w-2 h-6 bg-white rounded mx-0.5 animate-pulse"></div>
                <div className="w-2 h-8 bg-white rounded mx-0.5 animate-pulse delay-75"></div>
                <div className="w-2 h-4 bg-white rounded mx-0.5 animate-pulse delay-150"></div>
              </div>
            ) : (
              <Mic className="w-8 h-8 text-white" />
            )}
          </button>

          {isConnected && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Live
              </div>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-500">
          {!isConnected
            ? 'Start a conversation to begin voice chat'
            : isSpeaking
            ? 'AI is speaking...'
            : 'Listening for your voice...'
          }
        </p>

        
        {/* Agent Information */}
        {showDebug && getCurrentStepAgentId() && (
          <p className="text-xs text-gray-400">
            Agent ID: {getCurrentStepAgentId()}
          </p>
        )}
        {showDebug && getCurrentStepConversationId() && (
          <p className="text-xs text-gray-400 mt-1">
            Conversation ID: {getCurrentStepConversationId()}
          </p>
        )}
      </div>
    </div>
  );
};
