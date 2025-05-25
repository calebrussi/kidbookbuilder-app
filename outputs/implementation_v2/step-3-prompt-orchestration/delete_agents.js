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
      return false;
    }
    
    console.log(`Found agent '${agentName}' with ID: ${agentToDelete.agent_id}`);
    
    // Delete the agent
    await axios.delete(`${API_URL}/${agentToDelete.agent_id}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    console.log(`Successfully deleted agent '${agentName}' (ID: ${agentToDelete.agent_id})`);
    return true;
    
  } catch (error) {
    console.error(`Error deleting agent '${agentName}':`);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    return false;
  }
}

async function deleteMultipleAgents(agentNames) {
  let successCount = 0;
  let failCount = 0;
  const results = {
    successful: [],
    failed: []
  };
  
  console.log(`Attempting to delete ${agentNames.length} agent(s)...`);
  
  for (const agentName of agentNames) {
    const success = await deleteAgent(agentName);
    if (success) {
      successCount++;
      results.successful.push(agentName);
    } else {
      failCount++;
      results.failed.push(agentName);
    }
  }
  
  console.log('\n=== Deletion Summary ===');
  console.log(`Successfully deleted: ${successCount} agent(s)`);
  if (results.successful.length > 0) {
    console.log('   ' + results.successful.join(', '));
  }
  
  console.log(`Failed to delete: ${failCount} agent(s)`);
  if (results.failed.length > 0) {
    console.log('   ' + results.failed.join(', '));
  }
  
  return results;
}

// Run if called directly from command line
if (require.main === module) {
  const agentNames = process.argv.slice(2);
  
  if (agentNames.length === 0) {
    console.log('Usage: node delete_agents.js <agent_name> [agent_name2] [agent_name3] ...');
    console.log('Example: node delete_agents.js story_setting_agent hero_challenges_agent');
    process.exit(1);
  }
  
  deleteMultipleAgents(agentNames)
    .then(results => {
      if (results.failed.length > 0) {
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = { 
    deleteAgent: (name) => deleteAgent(name),
    deleteMultipleAgents: (names) => deleteMultipleAgents(names)
  };
}
