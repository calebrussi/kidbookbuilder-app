require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function createAgent() {
  try {
    console.log('Starting hero challenges agent creation process...');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    console.log('API key found');

    // First check if an agent with this name already exists
    console.log('Checking for existing agents...');
    const agentsResponse = await axios.get(`${API_URL}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    const existingAgents = agentsResponse.data.agents || [];
    for (const agent of existingAgents) {
      if (agent.name === 'hero_challenges_agent') {
        console.log(`Found existing hero challenges agent: ${agent.agent_id}`);
        console.log('Please delete existing agents first.');
        process.exit(0);
      }
    }

    // Read the hero challenges agent configuration
    const agentConfigPath = path.join(__dirname, 'agents', 'hero_challenges_agent.json');
    console.log('Reading config from:', agentConfigPath);
    
    if (!fs.existsSync(agentConfigPath)) {
      throw new Error(`Configuration file not found at ${agentConfigPath}`);
    }

    const config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
    console.log('Configuration loaded successfully');
    console.log('Sending request to ElevenLabs...');

    // First test the connection
    try {
      await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY
        }
      });
      console.log('Successfully connected to ElevenLabs API');
    } catch (error) {
      throw new Error(`Failed to connect to ElevenLabs API: ${error.message}`);
    }

    // Create the agent
    const response = await axios.post(`${API_URL}/create`, config, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 300;
      }
    });

    console.log('Hero Challenges Agent created successfully!');
    console.log('Agent ID:', response.data.agent_id);
    console.log('Agent Status:', response.data.status);
    
    // Save the agent details to a file for future reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, 'agents', `hero_challenges_agent_${timestamp}.json`);
    
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
      console.error('Full error:', error.response.data.detail || error.response.data.message);
    } else {
      console.error('Error message:', error.message);
      console.error('Full error:', error);
    }
    process.exit(1);
  }
}

createAgent();
