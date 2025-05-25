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
    
    // Get all local agent files - check for organized structure first
    let agentFiles = [];
    const standardAgentsDir = path.join(AGENTS_DIR, 'standard');
    
    if (fs.existsSync(standardAgentsDir)) {
      // New organized structure
      console.log('\nUsing organized directory structure.');
      
      // Get standard agent files
      const standardFiles = fs.readdirSync(standardAgentsDir)
        .filter(file => file.endsWith('.json'))
        .map(file => ({ file, path: path.join(standardAgentsDir, file), type: 'standard' }));
      
      agentFiles = [...standardFiles];
      
      // Display organized directory information
      console.log(`Found ${standardFiles.length} standard agent files in /agents/standard/`);
      
      // Optionally show beta files count
      const betaDir = path.join(AGENTS_DIR, 'beta');
      if (fs.existsSync(betaDir)) {
        const betaFiles = fs.readdirSync(betaDir)
          .filter(file => file.endsWith('.json'))
          .length;
        console.log(`Found ${betaFiles} beta agent files in /agents/beta/`);
      }
    } else {
      // Legacy flat structure
      console.log('\nUsing legacy flat directory structure.');
      
      const legacyFiles = fs.readdirSync(AGENTS_DIR)
        .filter(file => 
          file.endsWith('.json') && 
          !file.includes('beta') && 
          !file.includes('clean') &&
          !file.match(/.*_\d{4}-\d{2}-\d{2}T.*\.json/)
        )
        .map(file => ({ file, path: path.join(AGENTS_DIR, file), type: 'legacy' }));
      
      agentFiles = [...legacyFiles];
      console.log(`Found ${legacyFiles.length} agent files locally.`);
    }
    
    // Compare local files with remote agents
    const remoteAgentNames = new Set(agents.map(a => a.name));
    const localAgentNames = new Set();
    
    agentFiles.forEach(item => {
      try {
        const content = JSON.parse(fs.readFileSync(item.path, 'utf8'));
        if (content.name) {
          localAgentNames.add(content.name);
        }
      } catch (err) {
        console.log(`Error reading ${item.file}: ${err.message}`);
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
    reportContent += '| File Name | Agent Name | Type | Has Conversation Config |\n';
    reportContent += '|-----------|------------|------|-------------------------|\n';
    
    agentFiles.forEach(item => {
      try {
        const content = JSON.parse(fs.readFileSync(item.path, 'utf8'));
        const agentName = content.name || 'Unknown';
        const hasConfig = content.conversation_config ? 'Yes' : 'No';
        reportContent += `| ${item.file} | ${agentName} | ${item.type} | ${hasConfig} |\n`;
      } catch (err) {
        reportContent += `| ${item.file} | Error | ${item.type} | Unknown |\n`;
      }
    });
    
    reportContent += `\n## Deployment Status\n\n`;
    
    reportContent += '### Missing Local Files\n\n';
    let missingLocalCount = 0;
    remoteAgentNames.forEach(name => {
      if (!localAgentNames.has(name)) {
        reportContent += `- ${name} (exists on ElevenLabs but no matching local file)\n`;
        missingLocalCount++;
      }
    });
    
    if (missingLocalCount === 0) {
      reportContent += '_No missing local files_\n';
    }
    
    reportContent += '\n### Missing Remote Agents\n\n';
    let missingRemoteCount = 0;
    localAgentNames.forEach(name => {
      if (!remoteAgentNames.has(name)) {
        reportContent += `- ${name} (exists locally but not on ElevenLabs)\n`;
        missingRemoteCount++;
      }
    });
    
    if (missingRemoteCount === 0) {
      reportContent += '_No missing remote agents_\n';
    }
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nFull report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Error listing agents:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  listElevenLabsAgents();
} else {
  module.exports = { listElevenLabsAgents };
}
