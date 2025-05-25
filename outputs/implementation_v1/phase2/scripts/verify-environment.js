/**
 * Phase 2 Environment Verification Script
 * 
 * This script checks that all required environment variables and dependencies
 * for Phase 2 are properly configured.
 */

console.log('\n🔍 Verifying Phase 2 environment...\n');

// Check Node.js version
const nodeVersion = process.version.replace('v', '');
const minNodeVersion = '16.0.0';

console.log(`Node.js version: ${nodeVersion}`);
if (compareVersions(nodeVersion, minNodeVersion) < 0) {
  console.error(`❌ Node.js version must be at least ${minNodeVersion}`);
  process.exit(1);
} else {
  console.log('✅ Node.js version is sufficient');
}

// Create required directories if they don't exist
const fs = require('fs');
const path = require('path');

const requiredDirs = [
  path.join(__dirname, '../dist'),
  path.join(__dirname, '../storage')
];

for (const dir of requiredDirs) {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Verify required packages
try {
  const packageJson = require('../../../package.json');
  const requiredPackages = [
    'express',
    'react',
    'react-dom',
    'typescript',
    'concurrently'
  ];
  
  console.log('\nChecking for required packages:');
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allPackagesFound = true;
  for (const pkg of requiredPackages) {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
    } else {
      console.error(`❌ Missing required package: ${pkg}`);
      allPackagesFound = false;
    }
  }
  
  if (!allPackagesFound) {
    console.error('\n❌ Some required packages are missing. Run npm install to install them.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Could not verify required packages:', error.message);
  process.exit(1);
}

console.log('\n✅ Phase 2 environment verification completed successfully!');
console.log('You can now start development with: npm run dev:phase2\n');

/**
 * Compare two version strings
 * @param {string} v1 - First version
 * @param {string} v2 - Second version
 * @returns {number} - 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    
    if (p1 !== p2) {
      return p1 > p2 ? 1 : -1;
    }
  }
  
  return 0;
} 