require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Read the agent configuration
const agentConfig = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'agents/world_type_agent.json'),
    'utf8'
  )
);

async function createAgent() {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

    const response = await axios.post(
      'https://api.elevenlabs.io/v1/convai/agents/create',
      agentConfig,
      {
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        }
      }
    );

    console.log('Agent created successfully!');
    console.log('Agent ID:', response.data.agent_id);
    
    // Save the agent ID to a file for future reference
    fs.writeFileSync(
      path.join(__dirname, 'agent-id.txt'),
      response.data.agent_id
    );
    
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
