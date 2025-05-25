require('dotenv').config();
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

// Agent name that should be removed as a duplicate
const DUPLICATE_AGENT_NAME = 'story_setting_agent';

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

async function deleteAgent(agentId, agentName) {
  try {
    console.log(`Deleting agent ${agentName} (ID: ${agentId})...`);
    await axios.delete(`${API_URL}/${agentId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    console.log(`Successfully deleted agent ${agentName} (ID: ${agentId})`);
    return true;
  } catch (error) {
    console.error(`Failed to delete agent ${agentName} (ID: ${agentId}):`, error.message);
    return false;
  }
}

async function removeDuplicateSettingAgent() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    const agents = await getExistingAgents();
    
    // Find the duplicate agent by name
    const duplicateAgent = agents.find(agent => agent.name === DUPLICATE_AGENT_NAME);
    
    if (!duplicateAgent) {
      console.log(`No agent found with name "${DUPLICATE_AGENT_NAME}"`);
      return;
    }
    
    console.log(`Found duplicate agent: ${DUPLICATE_AGENT_NAME} (ID: ${duplicateAgent.agent_id})`);
    console.log(`Created at: ${new Date(duplicateAgent.created_at).toLocaleString()}`);
    
    // Also find the setting_type_agent to confirm it exists
    const mainAgent = agents.find(agent => agent.name === 'setting_type_agent');
    
    if (mainAgent) {
      console.log(`Found main agent: setting_type_agent (ID: ${mainAgent.agent_id})`);
      console.log(`Created at: ${new Date(mainAgent.created_at).toLocaleString()}`);
    } else {
      console.log('Warning: setting_type_agent not found! You might want to create it first.');
      const proceed = await askForConfirmation('Do you want to continue with deletion anyway?');
      if (!proceed) {
        console.log('Operation cancelled.');
        return;
      }
    }
    
    const confirm = await askForConfirmation(`Are you sure you want to delete "${DUPLICATE_AGENT_NAME}"?`);
    
    if (!confirm) {
      console.log('Operation cancelled.');
      return;
    }
    
    const success = await deleteAgent(duplicateAgent.agent_id, DUPLICATE_AGENT_NAME);
    
    if (success) {
      console.log(`\n✅ Successfully removed duplicate agent "${DUPLICATE_AGENT_NAME}"`);
      
      if (mainAgent) {
        console.log(`\nYou now have only the main agent "setting_type_agent" (ID: ${mainAgent.agent_id})`);
      } else {
        console.log('\nReminder: You still need to create the "setting_type_agent"');
      }
    } else {
      console.log(`\n❌ Failed to remove duplicate agent "${DUPLICATE_AGENT_NAME}"`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

function askForConfirmation(question) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${question} (yes/no): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Run the script
removeDuplicateSettingAgent();
