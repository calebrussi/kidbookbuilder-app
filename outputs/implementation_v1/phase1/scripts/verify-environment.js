/**
 * Environment Verification Script
 * 
 * This script checks all development dependencies and confirms
 * the environment is properly configured for development.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log file setup
const logFile = path.join(__dirname, '../logs/environment-verification.log');
const logDir = path.dirname(logFile);

// Create logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize log
const log = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logMessage);
  console.log(message);
};

log('Starting environment verification...');

// Check Node.js version
try {
  const nodeVersion = process.version;
  log(`Node.js version: ${nodeVersion}`);
  
  // Verify minimum Node.js version (adjust as needed)
  const minNodeVersion = 'v16.0.0';
  if (nodeVersion.localeCompare(minNodeVersion, undefined, { numeric: true, sensitivity: 'base' }) < 0) {
    log(`WARNING: Node.js version ${nodeVersion} is below recommended minimum of ${minNodeVersion}`);
  } else {
    log('Node.js version check: PASSED');
  }
} catch (error) {
  log(`ERROR checking Node.js version: ${error.message}`);
}

// Check npm version
try {
  const npmVersion = execSync('npm --version').toString().trim();
  log(`npm version: ${npmVersion}`);
  log('npm availability check: PASSED');
} catch (error) {
  log(`ERROR checking npm: ${error.message}`);
}

// Check required directories exist
const requiredDirs = [
  '../config',
  '../docs',
  '../scripts'
];

requiredDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    log(`Directory check for ${dir}: PASSED`);
  } else {
    log(`ERROR: Required directory ${dir} not found`);
  }
});

// Check package.json exists
const packageJsonPath = path.join(__dirname, '../../../package.json');
if (fs.existsSync(packageJsonPath)) {
  log('package.json check: PASSED');
  
  // Check required dependencies
  try {
    const packageJson = require(packageJsonPath);
    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});
    
    log(`Found ${dependencies.length} dependencies and ${devDependencies.length} dev dependencies`);
  } catch (error) {
    log(`ERROR reading package.json: ${error.message}`);
  }
} else {
  log('ERROR: package.json not found');
}

log('Environment verification completed.'); 