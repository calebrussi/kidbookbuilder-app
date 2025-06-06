import { useConversation } from "@elevenlabs/react";
import { useCallback, useState } from "react";

export interface ElevenLabsMessage {
  id: string;
  content: string;
  source?: "user" | "ai"; // Add source field
  timestamp: Date;
  isBot: boolean;
  agentId?: string;
}

interface UseElevenLabsConversationProps {
  agentId?: string;
  onMessage?: (message: ElevenLabsMessage) => void;
  onConnect?: (props?: any) => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

export function useElevenLabsConversation({
  agentId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseElevenLabsConversationProps) {
  const [messages, setMessages] = useState<ElevenLabsMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: (props) => {
      console.log("ElevenLabs conversation connected", props);
      setError(null);
      onConnect?.(props);
    },
    onDisconnect: () => {
      console.log("ElevenLabs conversation disconnected");
      onDisconnect?.();
    },
    onMessage: (message) => {
      console.log("ElevenLabs message received:", message);
      const elevenLabsMessage: ElevenLabsMessage = {
        id: Date.now().toString(),
        source: message.source, // Include source from ElevenLabs
        content:
          message.message || "I heard you, but I'm processing your request...",
        timestamp: new Date(),
        isBot: true,
        agentId: agentId,
      };

      setMessages((prev) => [...prev, elevenLabsMessage]);
      onMessage?.(elevenLabsMessage);
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      const errorMessage =
        typeof error === "string"
          ? error
          : "Connection error. Please try again.";
      setError(errorMessage);
      onError?.(errorMessage);
    },
  });

  // Function to safely check if media permissions are available
  const checkMediaPermissions = async (): Promise<boolean> => {
    // Check if we're in a browser environment with mediaDevices API
    if (typeof window === 'undefined' || 
        typeof navigator === 'undefined' || 
        !navigator.mediaDevices) {
      console.warn("MediaDevices API is not available in this environment");
      return false;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone permission granted");
      return true;
    } catch (error) {
      console.warn("Microphone access error:", error);
      return false;
    }
  };
  
  const startConversation = useCallback(
    async (customAgentId?: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Try to get microphone permissions, but continue either way
        await checkMediaPermissions();
        
        const targetAgentId =
          customAgentId || agentId || import.meta.env.VITE_ELEVENLABS_AGENT_ID;

        if (!targetAgentId) {
          throw new Error(
            "No agent ID provided. Please set VITE_ELEVENLABS_AGENT_ID in your environment variables."
          );
        }

        // Get signedUrl from backend using base URL from env
        const baseUrl = import.meta.env.VITE_API_BASE_URL;
        if (!baseUrl) {
          throw new Error("VITE_API_BASE_URL is not set in your environment variables.");
        }
        console.log(`Requesting signed URL for agent ID: ${targetAgentId}`);
        
        const response = await fetch(`${baseUrl}/api/workflow/agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentId: targetAgentId }),
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => null);
          console.error("Failed to get signedUrl, response:", response.status, errorText);
          throw new Error(`Failed to get signedUrl from backend: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        if (!result.success || !result.data?.signedUrl) {
          throw new Error(result.message || "No signedUrl returned from backend");
        }

        const signedUrl = result.data.signedUrl;

        // Start the conversation with the signedUrl
        await conversation.startSession({
          signedUrl,
        });
      } catch (error) {
        console.error("Failed to start ElevenLabs conversation:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to start conversation";
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [conversation, agentId, onError]
  );

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();

      const endMessage: ElevenLabsMessage = {
        id: "end-" + Date.now(),
        content: "Conversation ended. Click start to begin a new conversation.",
        timestamp: new Date(),
        isBot: true,
      };

      setMessages((prev) => [...prev, endMessage]);
    } catch (error) {
      console.error("Failed to stop conversation:", error);
    }
  }, [conversation]);

  const addUserMessage = useCallback((content: string) => {
    const userMessage: ElevenLabsMessage = {
      id: "user-" + Date.now(),
      content,
      timestamp: new Date(),
      isBot: false,
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Send the message to ElevenLabs if conversation is connected
    if (conversation.status === "connected") {
      try {
        conversation.sendUserMessage(content);
      } catch (error) {
        console.error("Failed to send user message to ElevenLabs:", error);
      }
    }
    
    return userMessage;
  }, [conversation]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    error,
    status: conversation.status,
    isSpeaking: conversation.isSpeaking,
    startConversation,
    stopConversation,
    addUserMessage,
    clearMessages,
    setError,
    conversation, // Expose the conversation object for direct access
    isConnected: conversation.status === "connected"
  };
}
