require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';

// The legacy agents to be deployed
const LEGACY_AGENTS = [
  'story_length_agent.json',
  'types_of_stories_you_love_agent.json',
  'world_type_agent.json'
];

async function deleteExistingAgents(agentName) {
  try {
    console.log(`Checking for existing agent with name: ${agentName}...`);
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });

    const existingAgents = response.data.agents || [];
    for (const agent of existingAgents) {
      if (agent.name === agentName) {
        console.log(`Found existing agent: ${agentName} (ID: ${agent.agent_id})`);
        console.log(`Deleting existing agent: ${agent.agent_id}`);
        await axios.delete(`${API_URL}/${agent.agent_id}`, {
          headers: {
            'xi-api-key': ELEVENLABS_API_KEY
          }
        });
        console.log(`Successfully deleted agent: ${agent.agent_id}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Error checking/deleting existing agents:', error.message);
    return false;
  }
}

async function createAgent(agentFileName) {
  try {
    console.log(`\n== Processing ${agentFileName} ==`);
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }

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
    console.log(`Creating agent: ${config.name}`);

    const response = await axios.post(`${API_URL}/create`, config, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log(`${config.name} created successfully!`);
    console.log('Agent ID:', response.data.agent_id);
    console.log('Agent Status:', response.data.status);
    
    return {
      name: config.name,
      agent_id: response.data.agent_id,
      status: response.data.status
    };
  } catch (error) {
    console.error(`Failed to create agent ${agentFileName}:`, error.message);
    return null;
  }
}

async function deployLegacyAgents() {
  console.log('Starting deployment of legacy agents...');
  
  const results = {
    successful: [],
    failed: []
  };
  
  for (const agentFile of LEGACY_AGENTS) {
    try {
      const result = await createAgent(agentFile);
      if (result) {
        results.successful.push(result);
      } else {
        results.failed.push(agentFile);
      }
    } catch (error) {
      console.error(`Error processing ${agentFile}:`, error.message);
      results.failed.push(agentFile);
    }
  }
  
  // Print summary
  console.log('\n\n==== DEPLOYMENT SUMMARY ====');
  console.log(`Successfully deployed: ${results.successful.length} agents`);
  console.log(`Failed to deploy: ${results.failed.length} agents`);
  
  console.log('\nSuccessfully deployed agents:');
  results.successful.forEach(agent => {
    console.log(`- ${agent.name} (ID: ${agent.agent_id})`);
  });
  
  if (results.failed.length > 0) {
    console.log('\nFailed to deploy:');
    results.failed.forEach(file => {
      console.log(`- ${file}`);
    });
  }
  
  // Save deployment report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `legacy_agent_deployment_${timestamp}.md`);
  
  let reportContent = `# Legacy Agent Deployment Report\n\n`;
  reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
  reportContent += `## Successfully Deployed (${results.successful.length})\n\n`;
  
  if (results.successful.length > 0) {
    reportContent += '| Agent Name | Agent ID | Status |\n';
    reportContent += '|------------|----------|--------|\n';
    
    results.successful.forEach(agent => {
      reportContent += `| ${agent.name} | ${agent.agent_id} | ${agent.status} |\n`;
    });
  } else {
    reportContent += 'No agents were successfully deployed.\n\n';
  }
  
  reportContent += `\n## Failed to Deploy (${results.failed.length})\n\n`;
  
  if (results.failed.length > 0) {
    reportContent += '- ' + results.failed.join('\n- ') + '\n';
  } else {
    reportContent += 'All agents were deployed successfully!\n';
  }
  
  fs.writeFileSync(reportPath, reportContent);
  console.log(`\nDeployment report saved to: ${reportPath}`);
}

// Execute the deployment
deployLegacyAgents().catch(error => {
  console.error('Deployment failed:', error.message);
});
