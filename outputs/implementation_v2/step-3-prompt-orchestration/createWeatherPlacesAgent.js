require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function createAgent() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    const config = {
      name: "weather_places_agent",
      conversation_config: {
        asr: {
          quality: "high",
          provider: "elevenlabs",
          user_input_audio_format: "pcm_16000",
          keywords: []
        },
        turn: {
          turn_timeout: 7,
          silence_end_call_timeout: 20,
          mode: "turn"
        },
        tts: {
          model_id: "eleven_flash_v2",
          voice_id: "21m00Tcm4TlvDq8ikWAM", // Using Rachel voice
          agent_output_audio_format: "pcm_16000",
          optimize_streaming_latency: 3,
          stability: 0.5,
          speed: 1,
          similarity_boost: 0.8
        },
        conversation: {
          text_only: false,
          max_duration_seconds: 300,
          client_events: ["audio", "interruption", "user_transcript", "agent_response", "agent_response_correction"]
        },
        agent: {
          first_message: "Let's add some atmosphere to your story! What kind of weather and places do you want in your story? Maybe it's always sunny and warm, or perhaps there are magical storms? Tell me about the environment you imagine!",
          language: "en",
          prompt: {
            prompt: "You are a friendly and enthusiastic storytelling companion talking to a 10-year-old child. Your role is to help them explore and describe the weather and environmental details of their story's setting. Use vivid, sensory language but keep it simple and age-appropriate. Ask about things like weather patterns, landscapes, special locations, and atmospheric details. Help them think about questions like 'Is it always sunny, or does it rain magical colors?' 'What special places exist in this world?' 'What does it feel like to be there?' Be encouraging and show excitement about their ideas. If they seem unsure, offer examples like 'In a magical forest, the trees might glow at night!' or 'In a desert kingdom, the sand could sparkle like diamonds!'",
            llm: "gemini-2.0-flash-001",
            temperature: 0.7,
            max_tokens: -1,
            tools: [
              {
                name: "end_call",
                description: "End the call when you have a clear understanding of the weather patterns and environmental details the child wants in their story. Once you have gathered specific details about the atmosphere and special places, confirm them with the child and if they agree, end the chat.",
                type: "system",
                params: {
                  system_tool_type: "end_call"
                }
              }
            ]
          }
        }
      },
      platform_settings: {
        auth: {
          enable_auth: false,
          allowlist: []
        },
        evaluation: {
          criteria: [
            {
              id: "environment_details",
              name: "environment_details",
              type: "prompt",
              conversation_goal_prompt: "Review the conversation transcript and determine if we have successfully gathered information about: the weather patterns in the story's setting, key environmental features and locations, atmospheric details, and any special or magical elements related to the environment that the child is excited about"
            }
          ]
        }
      }
    };

    const response = await axios.post(`${API_URL}/create`, config, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Agent created successfully!');
    console.log('Agent details:', response.data);
    
    // Save the agent details to a file for future reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, 'agents', `agent_${timestamp}.json`);
    
    // Ensure agents directory exists
    const agentsDir = path.join(__dirname, 'agents');
    if (!fs.existsSync(agentsDir)) {
      fs.mkdirSync(agentsDir);
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
    console.log('Agent details saved to:', outputPath);
    
  } catch (error) {
    console.error('Error creating agent:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

createAgent();
