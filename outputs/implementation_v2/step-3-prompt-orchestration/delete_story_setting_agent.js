// filepath: /Users/calebrussi/Sites/Proj_KidBookBuilder/outputs/implementation_v2/step-3-prompt-orchestration/delete_agent.js
require('dotenv').config();
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function deleteAgent(agentName) {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    console.log(`Looking for agent '${agentName}' to delete...`);
    
    // Get all agents
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    const agents = response.data.agents || [];
    const agentToDelete = agents.find(agent => agent.name === agentName);
    
    if (!agentToDelete) {
      console.log(`No agent found with name '${agentName}'`);
      return;
    }
    
    console.log(`Found agent '${AGENT_NAME}' with ID: ${agentToDelete.agent_id}`);
    
    // Delete the agent
    await axios.delete(`${API_URL}/${agentToDelete.agent_id}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    console.log(`Successfully deleted agent '${AGENT_NAME}'`);
    
  } catch (error) {
    console.error('Error deleting agent:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

deleteStorySettingAgent();
