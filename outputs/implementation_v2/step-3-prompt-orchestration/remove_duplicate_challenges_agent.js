require('dotenv').config();
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

async function getExistingAgents() {
  try {
    console.log('Fetching agents from ElevenLabs API...');
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    return response.data.agents || [];
  } catch (error) {
    console.error('Error fetching agents:', error.message);
    return [];
  }
}

async function deleteAgent(agentId) {
  try {
    console.log(`Deleting agent with ID: ${agentId}...`);
    await axios.delete(`${API_URL}/${agentId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    console.log(`Successfully deleted agent: ${agentId}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete agent ${agentId}:`, error.message);
    return false;
  }
}

async function removeDuplicateChallengesAgent() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    const agents = await getExistingAgents();
    
    // Find all challenges_to_face_agent instances
    const matchingAgents = agents.filter(agent => agent.name === 'challenges_to_face_agent');
    
    if (matchingAgents.length <= 1) {
      console.log('No duplicate challenges_to_face_agent found');
      return;
    }
    
    console.log(`Found ${matchingAgents.length} instances of challenges_to_face_agent`);
    
    // Sort by creation date - newest first
    matchingAgents.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return dateB - dateA;
    });
    
    // Keep the newest one, delete the rest
    console.log(`Keeping the newest one: ${matchingAgents[0].agent_id}`);
    
    for (let i = 1; i < matchingAgents.length; i++) {
      console.log(`Deleting duplicate: ${matchingAgents[i].agent_id}`);
      await deleteAgent(matchingAgents[i].agent_id);
    }
    
    console.log('Duplicate removal complete!');
    
  } catch (error) {
    console.error('Error removing duplicates:', error.message);
    process.exit(1);
  }
}

removeDuplicateChallengesAgent();
