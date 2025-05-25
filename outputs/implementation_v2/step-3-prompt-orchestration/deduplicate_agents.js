require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';
const AGENTS_DIR = path.join(__dirname, 'agents');

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

async function deleteAgent(agentId) {
  try {
    await axios.delete(`${API_URL}/${agentId}`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    return true;
  } catch (error) {
    console.error(`Error deleting agent ${agentId}:`, error.message);
    return false;
  }
}

function findDuplicateAgents(agents) {
  const agentsByName = {};
  const duplicates = [];
  
  agents.forEach(agent => {
    if (!agentsByName[agent.name]) {
      agentsByName[agent.name] = [];
    }
    agentsByName[agent.name].push(agent);
  });
  
  Object.entries(agentsByName).forEach(([name, agentList]) => {
    if (agentList.length > 1) {
      duplicates.push({
        name,
        agents: agentList.map(a => ({
          id: a.agent_id,
          createdAt: new Date(a.created_at).toLocaleString()
        }))
      });
    }
  });
  
  return duplicates;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function deduplicateAgents() {
  try {
    console.log('Fetching agents from ElevenLabs API...');
    if (!ELEVENLABS_API_KEY) {
      throw new Error('ELEVENLABS_API_KEY environment variable is not set');
    }
    
    const existingAgents = await getExistingAgents();
    console.log(`Found ${existingAgents.length} agents on ElevenLabs platform\n`);
    
    // Find duplicates
    const duplicates = findDuplicateAgents(existingAgents);
    if (duplicates.length === 0) {
      console.log('No duplicate agents found!');
      return;
    }
    
    console.log(`Found ${duplicates.length} agents with duplicates:\n`);
    
    for (const [index, dup] of duplicates.entries()) {
      console.log(`${index + 1}. "${dup.name}" has ${dup.agents.length} versions:`);
      dup.agents.forEach((agent, i) => {
        console.log(`   ${i + 1}. ID: ${agent.id}, Created: ${agent.createdAt}`);
      });
      console.log('');
    }
    
    // Get user confirmation
    const confirm = await question('Do you want to delete duplicate agents? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('Deduplication cancelled.');
      rl.close();
      return;
    }
    
    console.log('\nDeduplicating agents...');
    const deleted = [];
    
    for (const dup of duplicates) {
      // Keep the most recent agent, delete others
      const agents = dup.agents.slice();
      agents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`\nFor "${dup.name}", keeping the most recent: ${agents[0].id}`);
      
      for (let i = 1; i < agents.length; i++) {
        console.log(`  Deleting ${agents[i].id}...`);
        const success = await deleteAgent(agents[i].id);
        if (success) {
          console.log(`  ✓ Deleted ${agents[i].id}`);
          deleted.push({
            name: dup.name,
            id: agents[i].id,
            createdAt: agents[i].createdAt
          });
        } else {
          console.log(`  ✗ Failed to delete ${agents[i].id}`);
        }
      }
    }
    
    console.log(`\nSummary: Deleted ${deleted.length} duplicate agents.`);
    
    // Save deduplication report
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportPath = path.join(__dirname, `deduplication_report_${timestamp}.md`);
    
    let report = `# ElevenLabs Agents Deduplication Report\n\n`;
    report += `Generated on: ${new Date().toLocaleString()}\n\n`;
    report += `## Deleted Agents (${deleted.length})\n\n`;
    report += '| Agent Name | Agent ID | Created At |\n';
    report += '|------------|----------|------------|\n';
    
    deleted.forEach(agent => {
      report += `| ${agent.name} | ${agent.id} | ${agent.createdAt} |\n`;
    });
    
    fs.writeFileSync(reportPath, report);
    console.log(`\nDeduplication report saved to: ${reportPath}`);
    
    rl.close();
    
  } catch (error) {
    console.error('Error in deduplication process:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error message:', error.message);
    }
    rl.close();
    process.exit(1);
  }
}

deduplicateAgents();
