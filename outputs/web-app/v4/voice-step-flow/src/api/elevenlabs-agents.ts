/**
 * ElevenLabs Agent Creation API
 * 
 * This module handles creating personalized agents via the ElevenLabs API
 */

export interface CreateAgentRequest {
  name: string;
  description: string;
  prompt: string;
  voice_id?: string;
  language?: string;
  dataFieldName?: string;
  dataCollectionDescription?: string;
  firstMessage?: string;
}

export interface CreateAgentResponse {
  agent_id: string;
  name: string;
  description?: string;
  prompt?: string;
  voice_id?: string;
  created_at?: string;
  status?: string;
}

export interface ElevenLabsError {
  error: string;
  message: string;
}

/**
 * Create a new personalized agent via ElevenLabs API
 */
export async function createPersonalizedAgent(request: CreateAgentRequest): Promise<CreateAgentResponse> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  console.log('🔑 API Key status:', {
    hasApiKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 8) + '...' || 'none',
    envVarName: 'VITE_ELEVENLABS_API_KEY'
  });

  console.log('🎯 Creating personalized agent:', {
    name: request.name,
    description: request.description.substring(0, 100) + '...'
  });

  try {
    // Use the exact same approach as your working scripts
    console.log('🔗 Using working endpoint: https://api.elevenlabs.io/v1/convai/agents/create');
    
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        name: request.name,
        conversation_config: {
          conversation: {
            text_only: false,
            max_duration_seconds: 600,
            client_events: [
              "audio",
              "interruption", 
              "user_transcript",
              "agent_response",
              "agent_response_correction",
              "vad_score"
            ]
          },
          agent: {
            first_message: request.firstMessage || "Hi! I'm here to help you with this part of your story creation journey.",
            language: request.language || 'en',
            prompt: {
              prompt: request.prompt,
              llm: "gemini-2.0-flash-001",
              temperature: 0.7,
              max_tokens: -1,
              tools: [
                {
                  name: "end_call",
                  description: "End the call when the conversation objective has been achieved.",
                  response_timeout_secs: 20,
                  type: "system",
                  params: {
                    system_tool_type: "end_call"
                  }
                }
              ]
            }
          },
          tts: {
            voice_id: request.voice_id || 'ErXwobaYiN019PkySvjV' // Eric - consistent voice for all agents
          }
        },
        platform_settings: {
          evaluation: {
            criteria: [
              {
                id: "story_data_collection",
                name: "story_data_collection", 
                type: "prompt",
                conversation_goal_prompt: "Mark as success if relevant story information was collected through questions and answers, even if responses are brief or incomplete."
              }
            ]
          },
          data_collection: {
            [request.dataFieldName || "story_info"]: {
              type: "string",
              description: request.dataCollectionDescription || request.description || "Collect story information through conversational questions and answers"
            }
          }
        }
      }),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: 'Failed to parse error response' };
      }
      
      console.error('❌ ElevenLabs API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        requestBody: {
          name: request.name,
          description: request.description?.substring(0, 100) + '...',
          promptLength: request.prompt?.length,
          voice_id: request.voice_id || 'ErXwobaYiN019PkySvjV'
        }
      });
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const agentData = await response.json();
    console.log('✅ Successfully created personalized agent:', agentData.agent_id);
    
    return {
      agent_id: agentData.agent_id,
      name: agentData.name || request.name,
      description: agentData.description,
      prompt: agentData.prompt,
      voice_id: agentData.voice_id,
      status: 'created'
    };
    
  } catch (error) {
    console.error('❌ Failed to create personalized agent:', error);
    throw error;
  }
}

/**
 * Delete a personalized agent via ElevenLabs API
 */
export async function deletePersonalizedAgent(agentId: string): Promise<void> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  console.log('🗑️ Deleting personalized agent:', agentId);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    console.log('✅ Successfully deleted personalized agent:', agentId);

  } catch (error) {
    console.error('❌ Failed to delete personalized agent:', error);
    throw error;
  }
}

/**
 * Update a personalized agent's prompt via ElevenLabs API
 */
export async function updatePersonalizedAgent(
  agentId: string, 
  updates: Partial<CreateAgentRequest>
): Promise<CreateAgentResponse> {
  const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ElevenLabs API key not configured');
  }

  console.log('🔄 Updating personalized agent:', agentId);

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData.message || response.statusText}`);
    }

    const agentData = await response.json();
    console.log('✅ Successfully updated personalized agent:', agentId);

    return {
      agent_id: agentData.agent_id,
      name: agentData.name,
      description: agentData.description,
      prompt: agentData.prompt,
      voice_id: agentData.voice_id,
      created_at: agentData.created_at
    };

  } catch (error) {
    console.error('❌ Failed to update personalized agent:', error);
    throw error;
  }
}
