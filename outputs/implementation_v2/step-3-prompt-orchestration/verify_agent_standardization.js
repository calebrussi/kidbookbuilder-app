require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1/convai/agents';
const AGENTS_BASE_DIR = path.join(__dirname, 'agents');

// Handle directory structure
const args = process.argv.slice(2);
let agentSubDir = 'production'; // Default to production directory

// Check for directory argument
const dirArgIndex = args.findIndex(arg => arg.startsWith('--dir='));
if (dirArgIndex !== -1) {
  agentSubDir = args[dirArgIndex].split('=')[1];
}

const AGENTS_DIR = path.join(AGENTS_BASE_DIR, agentSubDir);

async function verifyAgentStandardization() {
  try {
    console.log('=== Agent Standardization Verification ===\n');
    console.log('Checking for properly standardized agent files...\n');
    
    // Get all agent files
    const agentFiles = fs.readdirSync(AGENTS_DIR)
      .filter(file => 
        file.endsWith('.json')
      );
    
    console.log(`Found ${agentFiles.length} agent files to verify.`);
    
    const verificationResults = {
      passed: [],
      failed: []
    };
    
    // Verify each agent file
    for (const file of agentFiles) {
      const filePath = path.join(AGENTS_DIR, file);
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Check for required properties
        const hasName = !!content.name;
        const hasConversationConfig = !!content.conversation_config;
        const hasPlatformSettings = !!content.platform_settings;
        const hasDataCollection = !!(content.platform_settings && content.platform_settings.data_collection);
        
        // Check data collection fields are all strings
        let dataFieldsAreStrings = true;
        if (hasDataCollection) {
          const dataFields = content.platform_settings.data_collection;
          for (const field in dataFields) {
            if (dataFields[field].type !== 'string') {
              dataFieldsAreStrings = false;
              break;
            }
          }
        }
        
        // Check if agent passes all requirements
        const passes = hasName && 
                      hasConversationConfig && 
                      hasPlatformSettings && 
                      hasDataCollection && 
                      dataFieldsAreStrings;
        
        // Add to appropriate result list
        if (passes) {
          verificationResults.passed.push({
            file,
            name: content.name,
            dataFields: Object.keys(content.platform_settings.data_collection || {}).length
          });
        } else {
          verificationResults.failed.push({
            file,
            name: content.name || 'Unknown',
            issues: {
              missingName: !hasName,
              missingConversationConfig: !hasConversationConfig,
              missingPlatformSettings: !hasPlatformSettings,
              missingDataCollection: !hasDataCollection,
              nonStringDataFields: !dataFieldsAreStrings
            }
          });
        }
      } catch (err) {
        verificationResults.failed.push({
          file,
          name: 'Error',
          issues: {
            parseError: err.message
          }
        });
      }
    }
    
    // Fetch agents from ElevenLabs
    console.log('\nFetching agents from ElevenLabs API to verify deployment...');
    
    const response = await axios.get(API_URL, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    });
    
    const remoteAgents = response.data.agents || [];
    console.log(`Found ${remoteAgents.length} agents on ElevenLabs platform.\n`);
    
    // Match local and remote agents
    const localAgentNames = new Set(verificationResults.passed.map(a => a.name));
    const remoteAgentNames = new Set(remoteAgents.map(a => a.name));
    
    const missingRemote = [...localAgentNames].filter(name => !remoteAgentNames.has(name));
    const missingLocal = [...remoteAgentNames].filter(name => !localAgentNames.has(name));
    
    // Generate verification report
    console.log('=== VERIFICATION RESULTS ===\n');
    console.log(`Passed: ${verificationResults.passed.length} agents`);
    console.log(`Failed: ${verificationResults.failed.length} agents`);
    console.log(`Missing remote deployment: ${missingRemote.length} agents`);
    console.log(`Unknown remote agents: ${missingLocal.length} agents\n`);
    
    if (verificationResults.failed.length > 0) {
      console.log('Failed Agent Files:');
      verificationResults.failed.forEach(item => {
        console.log(`- ${item.file} (${item.name})`);
        console.log('  Issues:', JSON.stringify(item.issues));
      });
      console.log();
    }
    
    if (missingRemote.length > 0) {
      console.log('Agents Not Deployed to ElevenLabs:');
      missingRemote.forEach(name => {
        console.log(`- ${name}`);
      });
      console.log();
    }
    
    if (missingLocal.length > 0) {
      console.log('Unknown Remote Agents (no matching local file):');
      missingLocal.forEach(name => {
        console.log(`- ${name}`);
      });
      console.log();
    }
    
    // Output successful agents
    console.log('Successfully Standardized Agents:');
    verificationResults.passed.forEach(item => {
      const isDeployed = remoteAgentNames.has(item.name);
      console.log(`- ${item.name} (${item.dataFields} data fields) - ${isDeployed ? 'Deployed' : 'Not Deployed'}`);
    });
    
    // Save verification report
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(__dirname, `agent_verification_${timestamp}.md`);
    
    let reportContent = `# Agent Standardization Verification Report\n\n`;
    reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
    reportContent += `## Summary\n\n`;
    reportContent += `- Total agent files checked: ${agentFiles.length}\n`;
    reportContent += `- Passed standardization: ${verificationResults.passed.length}\n`;
    reportContent += `- Failed standardization: ${verificationResults.failed.length}\n`;
    reportContent += `- Missing remote deployment: ${missingRemote.length}\n`;
    reportContent += `- Unknown remote agents: ${missingLocal.length}\n\n`;
    
    reportContent += `## Standardization Status\n\n`;
    reportContent += '| Agent Name | File | Data Fields | Deployed |\n';
    reportContent += '|------------|------|------------|----------|\n';
    
    verificationResults.passed.forEach(item => {
      const isDeployed = remoteAgentNames.has(item.name);
      reportContent += `| ${item.name} | ${item.file} | ${item.dataFields} | ${isDeployed ? '✅' : '❌'} |\n`;
    });
    
    if (verificationResults.failed.length > 0) {
      reportContent += `\n## Failed Standardization\n\n`;
      reportContent += '| Agent Name | File | Issues |\n';
      reportContent += '|------------|------|--------|\n';
      
      verificationResults.failed.forEach(item => {
        const issuesList = Object.entries(item.issues)
          .filter(([_, value]) => value)
          .map(([key, _]) => key)
          .join(', ');
        reportContent += `| ${item.name} | ${item.file} | ${issuesList} |\n`;
      });
    }
    
    if (missingRemote.length > 0 || missingLocal.length > 0) {
      reportContent += `\n## Deployment Mismatches\n\n`;
      
      if (missingRemote.length > 0) {
        reportContent += `### Agents Not Deployed to ElevenLabs\n\n`;
        reportContent += missingRemote.map(name => `- ${name}`).join('\n') + '\n\n';
      }
      
      if (missingLocal.length > 0) {
        reportContent += `### Unknown Remote Agents\n\n`;
        reportContent += missingLocal.map(name => `- ${name}`).join('\n') + '\n\n';
      }
    }
    
    reportContent += `\n## Next Steps\n\n`;
    
    if (verificationResults.failed.length > 0) {
      reportContent += `1. Fix the ${verificationResults.failed.length} agents that failed standardization\n`;
    }
    
    if (missingRemote.length > 0) {
      reportContent += `${verificationResults.failed.length > 0 ? '2' : '1'}. Deploy the ${missingRemote.length} agents that are properly standardized but not on ElevenLabs\n`;
    }
    
    if (missingLocal.length > 0) {
      const nextStep = (verificationResults.failed.length > 0 ? 2 : 1) + (missingRemote.length > 0 ? 1 : 0);
      reportContent += `${nextStep}. Investigate the ${missingLocal.length} unknown agents on ElevenLabs platform\n`;
    }
    
    if (verificationResults.failed.length === 0 && missingRemote.length === 0 && missingLocal.length === 0) {
      reportContent += `All agents are properly standardized and deployed! No further action needed.\n`;
    }
    
    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nVerification report saved to: ${reportPath}`);
  } catch (error) {
    console.error('Error verifying agent standardization:', error.message);
  }
}

// Print usage information
function printUsage() {
  console.log('\nUsage: node verify_agent_standardization.js [--dir=<directory>]');
  console.log('  --dir=production     Verify production agents (default)');
  console.log('  --dir=development    Verify development agents');
  console.log('  --dir=configs        Verify configuration files');
}

// Run the verification
verifyAgentStandardization().then(() => {
  printUsage();
});
