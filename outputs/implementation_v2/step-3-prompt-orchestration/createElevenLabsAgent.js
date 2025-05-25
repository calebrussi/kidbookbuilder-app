require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function deleteExistingAgents(agentName) {
  try {
    console.log('Checking for existing agents...');
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    const existingAgents = response.data.agents || [];
    for (const agent of existingAgents) {
      if (agent.name === agentName) {
        console.log(`Deleting existing agent: ${agent.agent_id}`);
        await axios.delete(`${API_URL}/${agent.agent_id}`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY
          }
        });
        console.log(`Successfully deleted agent: ${agent.agent_id}`);
      }
    }
  } catch (error) {
    console.error('Error checking/deleting existing agents:', error.message);
  }
}

async function createAgent(agentFileName) {
  try {
    console.log('Starting ElevenLabs agent creation process...');
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    console.log('API key found');

    // Read the agent configuration
    const agentConfigPath = path.join(__dirname, 'agents', agentFileName);
    console.log('Reading config from:', agentConfigPath);
    
    if (!fs.existsSync(agentConfigPath)) {
      throw new Error(`Configuration file not found at ${agentConfigPath}`);
    }
    
    const config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
    
    if (!config.name) {
      throw new Error(`Agent name not found in configuration file ${agentFileName}`);
    }
    
    // Delete any existing agent with the same name
    await deleteExistingAgents(config.name);
    
    console.log('Configuration loaded successfully');
    console.log('Sending request to ElevenLabs...');

    // Test connection first
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

    const response = await axios.post(`${API_URL}/create`, config, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`${config.name} created successfully!`);
    console.log('Agent ID:', response.data.agent_id);
    console.log('Agent Status:', response.data.status);
    
    // Save the agent details to a file for future reference only if SAVE_OUTPUT=true
    if (process.env.SAVE_OUTPUT === 'true') {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputPath = path.join(__dirname, 'agents', `${config.name}_${timestamp}.json`);
      
      // Ensure agents directory exists
      const agentsDir = path.join(__dirname, 'agents');
      if (!fs.existsSync(agentsDir)) {
        fs.mkdirSync(agentsDir);
      }
      
      fs.writeFileSync(outputPath, JSON.stringify(response.data, null, 2));
      console.log('Agent details saved to:', outputPath);
    }
    
    return {
      success: true,
      agentId: response.data.agent_id,
      agentName: config.name
    };
    
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
    return { success: false, error: error.message };
  }
}

// If called directly from command line
if (require.main === module) {
  // Get the agent file name from command line arguments
  const agentFileName = process.argv[2] || 'story_ending_agent.json';
  console.log(`Creating agent from file: ${agentFileName}`);
  createAgent(agentFileName)
    .then(result => {
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} else {
  module.exports = { createAgent, deleteExistingAgents };
}
