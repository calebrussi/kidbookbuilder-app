require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { createAgent, deleteExistingAgents } = require('./createElevenLabsAgent');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';
const AGENTS_DIR = path.join(__dirname, 'agents');

// List of agent name duplicates to handle
const DUPLICATE_AGENTS = {
  'story_setting_agent': 'setting_type_agent', // Use setting_type_agent instead of story_setting_agent
};

async function getExistingAgents() {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    return response.data.agents || [];
  } catch (error) {
    console.error('Error fetching existing agents:', error.message);
    return [];
  }
}

async function createAllAgents() {
  try {
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    // Get all json files in the agents directory
    const agentFiles = fs.readdirSync(AGENTS_DIR)
      .filter(file => 
        file.endsWith('.json') && 
        !file.includes('beta') && 
        !file.includes('clean') && 
        !file.includes('config') &&
        !file.match(/.*_\d{4}-\d{2}-\d{2}T.*\.json/)
      );

    // Fetch existing agents from ElevenLabs API
    const existingAgents = await getExistingAgents();
    console.log(`Found ${existingAgents.length} agents on ElevenLabs platform`);
    
    // Delete duplicate agents that should be replaced
    for (const [duplicateName, replacementName] of Object.entries(DUPLICATE_AGENTS)) {
      const duplicateAgent = existingAgents.find(agent => agent.name === duplicateName);
      if (duplicateAgent) {
        console.log(`Found duplicate agent: ${duplicateName} (ID: ${duplicateAgent.agent_id})`);
        console.log(`This will be replaced by: ${replacementName}`);
        await deleteExistingAgents(duplicateName);
      }
    }
    
    console.log(`Found ${agentFiles.length} agent files to process`);
    const results = [];
    
    // Process each agent file
    for (const file of agentFiles) {
      console.log(`\n----- Processing ${file} -----`);
      
      // Skip processing files that are replacements for duplicates
      const agentConfigPath = path.join(AGENTS_DIR, file);
      try {
        const config = JSON.parse(fs.readFileSync(agentConfigPath, 'utf8'));
        if (Object.values(DUPLICATE_AGENTS).includes(config.name)) {
          console.log(`This file (${config.name}) will replace a duplicate agent`);
        }
      } catch (err) {
        console.error(`Error reading config file ${file}:`, err.message);
      }
      
      const result = await createAgent(file);
      results.push({
        file,
        ...result
      });
    }
    
    // Print summary
    console.log('\n===== DEPLOYMENT SUMMARY =====');
    console.log(`Total agents processed: ${results.length}`);
    
    const successful = results.filter(r => r.success);
    console.log(`Successful: ${successful.length}`);
    
    if (successful.length > 0) {
      console.log('\nSuccessfully deployed agents:');
      successful.forEach(agent => {
        console.log(`- ${agent.agentName} (ID: ${agent.agentId})`);
      });
    }
    
    const failed = results.filter(r => !r.success);
    if (failed.length > 0) {
      console.log('\nFailed agents:');
      failed.forEach(agent => {
        console.log(`- ${agent.file}: ${agent.error}`);
      });
    }
    
    // Create a markdown summary file
    const summaryContent = generateSummaryMarkdown(results);
    const summaryPath = path.join(__dirname, 'agent_deployment_summary.md');
    fs.writeFileSync(summaryPath, summaryContent);
    console.log(`\nDeployment summary saved to: ${summaryPath}`);
    
  } catch (error) {
    console.error('Error in createAllAgents:', error);
  }
}

function generateSummaryMarkdown(results) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  let md = `# ElevenLabs Agents Deployment Summary\n\n`;
  md += `Deployment Date: ${timestamp}\n\n`;
  
  md += `## Successfully Deployed Agents (${results.filter(r => r.success).length})\n\n`;
  md += `| Agent Name | Agent ID | File |\n`;
  md += `|------------|----------|------|\n`;
  
  results.filter(r => r.success).forEach(agent => {
    md += `| ${agent.agentName} | ${agent.agentId} | ${agent.file} |\n`;
  });
  
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    md += `\n## Failed Deployments (${failed.length})\n\n`;
    md += `| File | Error |\n`;
    md += `|------|-------|\n`;
    
    failed.forEach(agent => {
      md += `| ${agent.file} | ${agent.error} |\n`;
    });
  }
  
  md += `\n## Agent Roles\n\n`;
  results.filter(r => r.success).forEach(agent => {
    md += `### ${agent.agentName}\n\n`;
    
    try {
      const configPath = path.join(AGENTS_DIR, agent.file);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      const firstMessage = config.conversation_config?.agent?.first_message || 
                          config.agent?.first_message || 
                          "No first message found";
      
      md += `**First Message:** ${firstMessage}\n\n`;
      
      // Add data collection fields if available
      const dataCollection = config.platform_settings?.data_collection;
      if (dataCollection) {
        md += `**Data Collection Fields:**\n\n`;
        for (const [key, value] of Object.entries(dataCollection)) {
          md += `- **${key}**: ${value.description}\n`;
        }
        md += '\n';
      }
    } catch (err) {
      md += `Error extracting details: ${err.message}\n\n`;
    }
  });
  
  return md;
}

createAllAgents();
