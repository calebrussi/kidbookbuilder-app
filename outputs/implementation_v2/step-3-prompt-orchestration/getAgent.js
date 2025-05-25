require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

// Ensure agents directory exists
const agentsDir = path.join(__dirname, 'agents');
if (!fs.existsSync(agentsDir)) {
  fs.mkdirSync(agentsDir);
}

async function getAgent(agentId) {
  try {
    const response = await axios.get(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    // Create a filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(agentsDir, `${agentId}_${timestamp}.json`);

    // Save the response to a file
    fs.writeFileSync(filename, JSON.stringify(response.data, null, 2));
    
    console.log('Agent details saved to:', filename);
    console.log('Agent details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching agent:', error.message);
    throw error;
  }
}

// Example usage
const agentId = 'agent_01jw06wd8re7k96s1g088jjnb6';
getAgent(agentId);