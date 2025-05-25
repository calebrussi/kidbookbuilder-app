require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function deleteAgent(agentId) {
  try {
    console.log(`Deleting agent: ${agentId}`);
    const response = await axios.delete(`${API_URL}/${agentId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    console.log('Delete response:', response.status, response.data);
    if (response.status === 204 || response.status === 200) {
      console.log(`Successfully deleted agent: ${agentId}`);
      return true;
    } else {
      console.log(`Unexpected response for ${agentId}:`, response.status);
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(`Agent ${agentId} not found (might be already deleted)`);
      return true;
    }
    console.error(`Error deleting agent ${agentId}:`, error.message);
    return false;
  }
}

async function cleanup() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    console.log('Starting cleanup...');

    // List of agent IDs to delete
    const agentsToDelete = [
      'agent_01jw09ypa2fmaanxt5bakbxqjq',  // Latest hero challenges agent
      'agent_01jw09mgaweb2rpmaq6w688zqq',  // Previous hero challenges agent
      'agent_01jw09j5dxf18bb5tkme7qry6h'   // Previous hero challenges agent
    ];

    for (const agentId of agentsToDelete) {
      await deleteAgent(agentId);
    }

    console.log('Cleanup completed successfully');
    
  } catch (error) {
    console.error('Error during cleanup:');
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

cleanup();
