require('dotenv').config();
const axios = require('axios');

async function createAgent() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY || 'sk_bed4475070661b789bab615b0a840210621342e8fbe1a74d';
    
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      {
        name: "Story Setting Selection Agent",
        description: "An agent that helps children explore and choose exciting story settings",
        initial_message: "Now, let's pick an exciting setting for your story! Would you like your story to take place in a magical kingdom with castles, in the depths of space with starships, underwater with sea creatures, or somewhere else? There are so many amazing places we could explore!",
        prompt: "You are a friendly and enthusiastic storytelling companion talking to a 10-year-old child. Your role is to help them choose and develop an exciting setting for their story. Present various options (like kingdoms, space, underwater worlds, jungles, cities, etc.) and help them explore what makes each setting special. Use simple but vivid language to describe the settings. If they seem unsure, give examples of what makes each setting fun (e.g., 'In a kingdom, you might have castles and knights! In space, you could have cool spaceships and distant planets!'). Be encouraging and show genuine interest in their ideas. If they suggest their own setting, help them develop it further by asking about specific details."
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Agent created successfully!');
    console.log('Agent ID:', response.data.agent_id);
    
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
