require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function deleteAgent(agentId) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    if (!agentId) {
      throw new Error('No agent ID file found. Please create an agent first.');
    }

    const response = await axios.delete(
      `https://api.elevenlabs.io/v1/convai/agents/${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey
        }
      }
    );

    console.log('Agent deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting agent:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

const agentId = 'agent_01jw006n95e9ws79mjtvxvh1g4';
deleteAgent(agentId);
