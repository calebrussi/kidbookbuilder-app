'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

// TypeScript declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
    interpretation: any;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: (event: Event) => void;
    onstart: (event: Event) => void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
    prototype: SpeechRecognition;
}

// Add global declarations
declare global {
    interface Window {
        SpeechRecognition: SpeechRecognitionConstructor;
        webkitSpeechRecognition: SpeechRecognitionConstructor;
    }
}

// Define possible voice options for testing different configurations
const VOICE_OPTIONS = {
    "Rachel": "21m00Tcm4TlvDq8ikWAM",
    "Drew": "29vD33N1CtxCmqQRPOHJ",
    "Clyde": "2EiwWnXFnvU5JabPnv8n"
};

type Message = {
    id: string;
    content: string;
    timestamp: string;
    sender: 'user' | 'agent';
};

type ConversationData = {
    id: string;
    startTime: string;
    messages: Message[];
};

export function Conversation() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hasApiKey, setHasApiKey] = useState<boolean>(false);
    const [detailedError, setDetailedError] = useState<any>(null);
    const [conversationData, setConversationData] = useState<ConversationData | null>(null);
    const [userInput, setUserInput] = useState<string>('');
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const agentId = process.env.NEXT_PUBLIC_AGENT_ID || '';
    const voiceId = VOICE_OPTIONS.Rachel; // Default voice for testing

    const conversation = useConversation({
        onConnect: () => {
            console.log('Connected to ElevenLabs');
            setError(null);
            setIsLoading(false);

            // Create a new conversation record when connection is established
            const newConversation: ConversationData = {
                id: uuidv4(),
                startTime: new Date().toISOString(),
                messages: []
            };
            setConversationData(newConversation);

            // Save initial conversation record
            saveConversation(newConversation);

            // Start speech recognition
            setupSpeechRecognition();
        },
        onDisconnect: () => {
            console.log('Disconnected from ElevenLabs');
            setConversationData(null);

            // Stop speech recognition
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        },
        onMessage: (message) => {
            console.log('Message from ElevenLabs:', message);

            if (conversationData) {
                // Add new message to conversation
                const newMessage: Message = {
                    id: uuidv4(),
                    content: typeof message === 'string' ? message : message.message || JSON.stringify(message),
                    timestamp: new Date().toISOString(),
                    sender: 'agent'
                };

                const updatedConversation = {
                    ...conversationData,
                    messages: [...conversationData.messages, newMessage]
                };

                setConversationData(updatedConversation);
                saveConversation(updatedConversation);
            }
        },
        onError: (err: any) => {
            console.error('Connection error:', err);
            setDetailedError(err);
            setError(`Connection error: ${String(err)}`);
            setIsLoading(false);
        }
    });

    // Set up speech recognition to capture user input
    const setupSpeechRecognition = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            return;
        }

        // Create speech recognition instance
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();

        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            console.log('Speech recognized:', transcript);

            if (transcript && conversation.status === 'connected') {
                addUserMessage(transcript);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
    }, [conversation.status]);

    // Function to save conversation to a JSON file
    const saveConversation = async (data: ConversationData) => {
        try {
            // Store in localStorage for testing
            localStorage.setItem(`conversation-${data.id}`, JSON.stringify(data));
            console.log('Conversation saved to localStorage:', data.id);

            // Also log to console for verification
            console.log('Conversation data:', data);
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Add user message to conversation data
    const addUserMessage = (text: string) => {
        if (!text || !conversationData) return;

        const userMessage: Message = {
            id: uuidv4(),
            content: text,
            timestamp: new Date().toISOString(),
            sender: 'user'
        };

        const updatedConversation = {
            ...conversationData,
            messages: [...conversationData.messages, userMessage]
        };

        setConversationData(updatedConversation);
        saveConversation(updatedConversation);
    };

    // Log relevant data for debugging
    useEffect(() => {
        console.log("Environment:", {
            agentId: process.env.NEXT_PUBLIC_AGENT_ID,
            hasAgentId: !!process.env.NEXT_PUBLIC_AGENT_ID
        });
        const envApiKey = process.env.NEXT_PUBLIC_AGENT_ID;
        setHasApiKey(!!envApiKey && envApiKey.length > 0);

        if (!envApiKey || envApiKey.length === 0) {
            setError('ElevenLabs agent ID is required. Please set NEXT_PUBLIC_AGENT_ID in your .env.local file.');
        }
    }, []);

    // Try different connection approaches
    const startConversation = useCallback(async () => {
        try {
            setError(null);
            setDetailedError(null);
            setIsLoading(true);

            // Request microphone permission
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            } catch (micError: any) {
                setError(`Microphone access denied: ${micError.message}`);
                setDetailedError(micError);
                setIsLoading(false);
                return;
            }

            // Start conversation with the agent ID 
            try {
                console.log("Starting conversation with agent ID:", agentId);

                // Use the simplest possible configuration to start
                await conversation.startSession({
                    agentId: agentId
                });
            } catch (error: any) {
                console.error('Failed to start conversation:', error);
                setDetailedError(error);
                setError(`Failed to start conversation: ${error.message || 'Unknown error'}`);
                setIsLoading(false);
            }
        } catch (error: any) {
            console.error('Failed to start conversation:', error);
            setDetailedError(error);
            setError(error.message || 'Failed to start conversation');
            setIsLoading(false);
        }
    }, [conversation, agentId]);

    const stopConversation = useCallback(async () => {
        try {
            await conversation.endSession();
        } catch (error) {
            console.error('Error ending session:', error);
        }
    }, [conversation]);

    return (
        <div className="flex flex-col items-center gap-6 p-6 bg-white rounded-lg shadow-md w-full max-w-md">
            <div className="w-full">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={startConversation}
                        disabled={conversation.status === 'connected' || isLoading || !hasApiKey}
                        className="px-5 py-3 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
                    >
                        {isLoading ? 'Connecting...' : 'Start Conversation'}
                    </button>
                    <button
                        onClick={stopConversation}
                        disabled={conversation.status !== 'connected'}
                        className="px-5 py-3 bg-red-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-red-700 transition-colors"
                    >
                        End Conversation
                    </button>
                </div>
            </div>

            {/* Conversation History */}
            {conversationData && conversationData.messages.length > 0 && (
                <div className="w-full mt-4 bg-gray-50 p-4 rounded-md max-h-80 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Conversation History</h3>
                    <div className="space-y-3">
                        {conversationData.messages.map((message) => (
                            <div
                                key={message.id}
                                className={`p-3 rounded-lg ${message.sender === 'user'
                                    ? 'bg-blue-100 ml-6'
                                    : 'bg-gray-200 mr-6'
                                    }`}
                            >
                                <div className="text-xs text-gray-500 mb-1">
                                    {message.sender === 'user' ? 'You' : 'AI Assistant'} - {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                                <div className="text-sm">{message.content}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full flex flex-col items-center mt-4 bg-gray-50 p-4 rounded-md">
                <div className={`flex items-center mb-2 ${conversation.status === 'connected' ? 'text-green-600' : 'text-gray-600'}`}>
                    <div className={`w-3 h-3 rounded-full mr-2 ${conversation.status === 'connected' ? 'bg-green-600' : 'bg-gray-400'}`}></div>
                    <span className="font-medium">Status: {conversation.status}</span>
                </div>

                {conversation.status === 'connected' && (
                    <div className="flex items-center mt-2">
                        <div className={`w-3 h-3 rounded-full mr-2 ${conversation.isSpeaking ? 'bg-blue-600' : 'bg-yellow-500'}`}></div>
                        <span className="font-medium">
                            Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}
                        </span>
                    </div>
                )}

                {error && (
                    <div className="text-red-500 mt-4 p-3 bg-red-50 border border-red-200 rounded w-full text-sm">
                        <div className="font-semibold mb-1">Error:</div>
                        <div>{error}</div>

                        {detailedError && (
                            <div className="mt-2 pt-2 border-t border-red-200 text-xs">
                                <details>
                                    <summary className="cursor-pointer font-semibold">Technical details</summary>
                                    <pre className="mt-2 overflow-auto p-2 bg-red-100 rounded text-xs">
                                        {JSON.stringify(detailedError, null, 2)}
                                    </pre>
                                </details>
                            </div>
                        )}

                        {!hasApiKey && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                                <p className="font-semibold">Setup required:</p>
                                <ol className="list-decimal pl-5 text-red-700 mt-2 space-y-1">
                                    <li>Create a <code className="bg-red-100 px-1 rounded">.env.local</code> file in the project root</li>
                                    <li>Add the following line:
                                        <pre className="bg-red-100 p-2 rounded mt-1 overflow-x-auto">
                                            NEXT_PUBLIC_AGENT_ID=your-agent-id-here
                                        </pre>
                                    </li>
                                    <li>Get your agent ID from <a href="https://elevenlabs.io/" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">ElevenLabs</a></li>
                                    <li>Restart the server</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {conversation.status !== 'connected' && !error && !isLoading && hasApiKey && (
                    <p className="text-gray-500 text-sm mt-2 text-center">
                        Click "Start Conversation" to begin talking with the AI assistant
                    </p>
                )}

                {!hasApiKey && !error && (
                    <div className="text-amber-600 mt-4 p-3 bg-amber-50 border border-amber-200 rounded w-full text-sm">
                        <p className="font-semibold">ElevenLabs agent ID required</p>
                        <p className="mt-1">This application requires an ElevenLabs agent ID to function.</p>
                    </div>
                )}

                {isLoading && (
                    <div className="text-blue-500 mt-4 p-3 bg-blue-50 border border-blue-200 rounded w-full text-center">
                        Connecting to ElevenLabs...
                    </div>
                )}
            </div>
        </div>
    );
} 