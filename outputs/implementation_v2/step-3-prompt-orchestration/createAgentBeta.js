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
      name: "story_setting_agent",
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
          first_message: "Now, let's pick an exciting setting for your story! Would you like your story to take place in a magical kingdom with castles, in the depths of space with starships, underwater with sea creatures, or somewhere else? There are so many amazing places we could explore!",
          language: "en",
          prompt: {
            prompt: "You are a friendly and enthusiastic storytelling companion talking to a 10-year-old child. Your role is to help them choose and develop an exciting setting for their story. Present various options (like kingdoms, space, underwater worlds, jungles, cities, etc.) and help them explore what makes each setting special. Use simple but vivid language to describe the settings. If they seem unsure, give examples of what makes each setting fun (e.g., 'In a kingdom, you might have castles and knights! In space, you could have cool spaceships and distant planets!'). Be encouraging and show genuine interest in their ideas. If they suggest their own setting, help them develop it further by asking about specific details.",
            llm: "gemini-2.0-flash-001",
            temperature: 0.7,
            max_tokens: -1,
            tools: [
              {
                name: "end_call",
                description: "End the call when you have a clear understanding of their preferred setting and some specific details about it. Once you have this information, confirm it with them and if they agree, end the chat.",
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
              id: "setting_preference",
              name: "setting_preference",
              type: "prompt",
              conversation_goal_prompt: "Review the conversation transcript and determine if we have successfully gathered information about: child's preferred story setting (kingdom, space, underwater, etc.), specific details about the chosen setting, and particular elements or features they're interested in"
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
