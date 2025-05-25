/**
 * This script updates the createElevenLabsAgent.js and create_all_agents.js files
 * to work with the new directory structure
 */
const fs = require('fs');
const path = require('path');

// Function to add directory argument handling to a file
function updateFileForDirectoryStructure(filePath, agentDirVarName) {
  console.log(`Updating ${filePath}...`);
  
  // Read the file
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Get the current AGENTS_DIR line
  const match = content.match(new RegExp(`const ${agentDirVarName} = .*agents.*`));
  
  if (!match) {
    console.error(`Could not find ${agentDirVarName} variable in ${filePath}`);
    return false;
  }
  
  // Replace with directory structure aware code
  const replacement = `// Handle directory structure
const args = process.argv.slice(2);
let agentSubDir = '';

// Check for directory argument
const dirArgIndex = args.findIndex(arg => arg.startsWith('--dir='));
if (dirArgIndex !== -1) {
  agentSubDir = args[dirArgIndex].split('=')[1];
}

// Set the agents directory with optional subdirectory
const AGENTS_BASE_DIR = path.join(__dirname, 'agents');
const ${agentDirVarName} = agentSubDir 
  ? path.join(AGENTS_BASE_DIR, agentSubDir) 
  : AGENTS_BASE_DIR;

console.log(\`Using agents directory: \${${agentDirVarName}}\`);`;

  // Replace the AGENTS_DIR line
  content = content.replace(match[0], replacement);
  
  // Write the updated content
  fs.writeFileSync(filePath, content);
  
  console.log(`Updated ${filePath} successfully`);
  return true;
}

// Update createElevenLabsAgent.js
const createElevenLabsAgentPath = path.join(__dirname, 'createElevenLabsAgent.js');
updateFileForDirectoryStructure(createElevenLabsAgentPath, 'AGENTS_DIR');

// Update create_all_agents.js if it exists
const createAllAgentsPath = path.join(__dirname, 'create_all_agents.js');
if (fs.existsSync(createAllAgentsPath)) {
  updateFileForDirectoryStructure(createAllAgentsPath, 'AGENTS_DIR');
}

console.log('\nUpdated scripts to support the new directory structure.');
console.log('You can now use:');
console.log('  node createElevenLabsAgent.js agent_name.json --dir=production');
console.log('  node create_all_agents.js --dir=production');
