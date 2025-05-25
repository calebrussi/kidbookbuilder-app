require('dotenv').config();
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

async function listAgents() {
  try {
    const response = await axios.get('https://api.elevenlabs.io/v1/convai/agents', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    console.log('Agents:', response.data);
  } catch (error) {
    console.error('Error fetching agents:', error.message);
  }
}

listAgents();
