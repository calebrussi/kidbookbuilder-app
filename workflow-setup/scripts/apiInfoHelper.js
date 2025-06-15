// Simple helper script to show information about API responses
const path = require('path');
const fs = require('fs');

// Define paths
const agentResponsesDir = path.join(__dirname, '..', 'lib', 'agent', 'outputs');
const outputsDir = path.join(__dirname, '..', 'outputs');

// Ensure the directory exists
if (!fs.existsSync(agentResponsesDir)) {
  fs.mkdirSync(agentResponsesDir, { recursive: true });
  console.log(`Created agent responses directory: ${agentResponsesDir}`);
}

// Display paths
console.log('\n===== API Response Locations =====');
console.log(`API responses are saved to: ${agentResponsesDir}`);
console.log(`Main outputs are saved to: ${outputsDir}`);

// List existing API response files
console.log('\n===== Existing API Response Files =====');
try {
  const files = fs.readdirSync(agentResponsesDir);
  if (files.length === 0) {
    console.log('No API response files found.');
  } else {
    files.forEach(file => {
      const stats = fs.statSync(path.join(agentResponsesDir, file));
      console.log(`- ${file} (${formatBytes(stats.size)} - ${new Date(stats.mtime).toLocaleString()})`);
    });
  }
} catch (error) {
  console.error('Error listing files:', error.message);
}

// Helper function to format file size
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

console.log('\n===== How to View API Responses =====');
console.log('Run one of the following commands to see API responses:');
console.log(`- cat ${path.join(agentResponsesDir, '<filename>')} | less`);
console.log(`- open ${agentResponsesDir}`);
