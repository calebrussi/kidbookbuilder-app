require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function createAgent() {
  try {
    console.log('Starting special powers agent creation process...');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    console.log('API key found');

    // Read the special powers agent configuration
    const agentConfigPath = path.join(__dirname, 'agents', 'special_powers_beta.json');
    console.log('Reading config from:', agentConfigPath);
    
    if (!fs.existsSync(agentConfigPath)) {
      throw new Error(`Configuration file not found at ${agentConfigPath}`);
    }

    const config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
    console.log('Configuration loaded successfully');
    console.log('Sending request to ElevenLabs...');

    const response = await axios.post(`${API_URL}/create`, config, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Special Powers Agent created successfully!');
    console.log('Agent ID:', response.data.agent_id);
    console.log('Agent Status:', response.data.status);
    
    // Save the agent details to a file for future reference
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = path.join(__dirname, 'agents', `special_powers_agent_${timestamp}.json`);
    
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
