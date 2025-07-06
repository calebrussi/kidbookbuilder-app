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

  console.log('🎯 Creating personalized agent:', {
    name: request.name,
    description: request.description.substring(0, 100) + '...'
  });

  try {
    // Try different possible endpoints for agent creation
    const endpoints = [
      'https://api.elevenlabs.io/v1/convai/agents',
      'https://api.elevenlabs.io/v1/agents',
      'https://api.elevenlabs.io/v1/convai/agent',
      'https://api.elevenlabs.io/v1/agent'
    ];
    
    let lastError;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔗 Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            name: request.name,
            description: request.description,
            prompt: request.prompt,
            voice_id: request.voice_id || 'pNInz6obpgDQGcFmaJgB', // Default voice
            language: request.language || 'en',
            // Additional ElevenLabs agent configuration
            conversation_config: {
              agent_prompt: request.prompt,
              turn_detection: {
                type: 'server_vad',
                threshold: 0.5,
                silence_duration_ms: 500
              }
            }
          })
        });

        if (response.ok) {
          const agentData = await response.json();
          console.log(`✅ Successfully created personalized agent with ${endpoint}:`, agentData.agent_id);
          return {
            agent_id: agentData.agent_id,
            name: agentData.name || request.name,
            status: 'created'
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = `${endpoint}: ${response.status} - ${errorData.message || response.statusText}`;
          console.log(`❌ Failed ${endpoint}: ${response.status}`);
        }
      } catch (endpointError) {
        lastError = `${endpoint}: ${endpointError.message}`;
        console.log(`❌ Error with ${endpoint}:`, endpointError.message);
      }
    }
    
    // If all endpoints failed, throw the last error
    throw new Error(`All ElevenLabs API endpoints failed. Last error: ${lastError}`);

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
