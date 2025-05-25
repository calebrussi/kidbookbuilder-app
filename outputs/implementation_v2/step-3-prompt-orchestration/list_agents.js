require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';
const AGENTS_DIR = path.join(__dirname, 'agents');

async function listElevenLabsAgents() {
  try {
    console.log('Fetching agents from ElevenLabs API...');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    const agents = response.data.agents || [];
    console.log(`Found ${agents.length} agents on ElevenLabs:\n`);
    
    // Sort alphabetically by name
    agents.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create table format
    console.log('| Agent Name | Agent ID | Creation Date |');
    console.log('|------------|----------|---------------|');
    
    agents.forEach(agent => {
      console.log(`| ${agent.name} | ${agent.agent_id} | ${new Date(agent.created_at).toLocaleString()} |`);
    });
    
    // Get all local agent files
    const agentFiles = fs.readdirSync(AGENTS_DIR)
      .filter(file => 
        file.endsWith('.json') && 
        !file.includes('beta') && 
        !file.includes('clean') &&
        !file.match(/.*_\d{4}-\d{2}-\d{2}T.*\.json/)
      );
    
    console.log(`\nFound ${agentFiles.length} agent files locally.`);
    
    // Compare local files with remote agents
    const remoteAgentNames = new Set(agents.map(a => a.name));
    const localAgentNames = new Set();
    
    agentFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'));
        if (content.name) {
          localAgentNames.add(content.name);
        }
      } catch (err) {
        console.log(`Error reading ${file}: ${err.message}`);
      }
    });
    
    console.log('\n## Missing Local Agent Files:');
    remoteAgentNames.forEach(name => {
      if (!localAgentNames.has(name)) {
        console.log(`- ${name} (exists on ElevenLabs but no matching local file)`);
      }
    });
    
    console.log('\n## Missing Remote Agents:');
    localAgentNames.forEach(name => {
      if (!remoteAgentNames.has(name)) {
        console.log(`- ${name} (exists locally but not on ElevenLabs)`);
      }
    });
    
    // Save the full report to a file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(__dirname, `agent_inventory_${timestamp}.md`);
    
    let reportContent = `# ElevenLabs Agents Inventory\n\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    reportContent += `## Remote Agents (${agents.length})\n\n`;
    reportContent += '| Agent Name | Agent ID | Creation Date |\n';
    reportContent += '|------------|----------|---------------|\n';
    
    agents.forEach(agent => {
      reportContent += `| ${agent.name} | ${agent.agent_id} | ${new Date(agent.created_at).toLocaleString()} |\n`;
    });
    
    reportContent += `\n## Local Agent Files (${agentFiles.length})\n\n`;
    reportContent += '| File Name | Agent Name | Has Conversation Config |\n';
    reportContent += '|-----------|------------|--------------------------|\n';
    
    agentFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(path.join(AGENTS_DIR, file), 'utf8'));
        const agentName = content.name || 'Unknown';
        const hasConfig = content.conversation_config ? 'Yes' : 'No';
        reportContent += `| ${file} | ${agentName} | ${hasConfig} |\n`;
      } catch (err) {
        reportContent += `| ${file} | Error reading file | N/A |\n`;
      }
    });
    
    reportContent += '\n## Missing Local Agent Files:\n\n';
    let missingLocalCount = 0;
    remoteAgentNames.forEach(name => {
      if (!localAgentNames.has(name)) {
        reportContent += `- ${name} (exists on ElevenLabs but no matching local file)\n`;
        missingLocalCount++;
      }
    });
    if (missingLocalCount === 0) reportContent += '- None\n';
    
    reportContent += '\n## Missing Remote Agents:\n\n';
    let missingRemoteCount = 0;
    localAgentNames.forEach(name => {
      if (!remoteAgentNames.has(name)) {
        reportContent += `- ${name} (exists locally but not on ElevenLabs)\n`;
        missingRemoteCount++;
      }
    });
    if (missingRemoteCount === 0) reportContent += '- None\n';
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nFull report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Error fetching agents:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

listElevenLabsAgents();
