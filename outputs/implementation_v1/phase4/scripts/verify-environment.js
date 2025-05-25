/**
 * Verification script for Phase 4 environment
 */

console.log('\n🔍 Verifying Phase 4 environment...\n');

// Check Node.js version
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);
if (nodeVersion.match(/^v(\d+)\./)[1] < 16) {
  console.error('❌ Node.js version 16 or higher is required');
  process.exit(1);
} else {
  console.log('✅ Node.js version is sufficient');
}

// Check for required packages
console.log('\nChecking for required packages:');
try {
  const packageJson = require('../../../v_2/package.json');
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredPackages = [
    'express',
    'react',
    'react-dom',
    'typescript',
    'concurrently',
    'socket.io',   // For real-time analytics
    'pdfkit',      // For PDF export
    'html-to-text' // For content conversion
  ];
  
  for (const pkg of requiredPackages) {
    if (dependencies[pkg]) {
      console.log(`✅ ${pkg}: ${dependencies[pkg]}`);
    } else {
      console.error(`❌ ${pkg} is required but not installed`);
      process.exit(1);
    }
  }
} catch (error) {
  console.error('❌ Could not read package.json', error);
  process.exit(1);
}

// All checks passed
console.log('\n✅ Phase 4 environment verification completed successfully!');
console.log('You can now start development with: npm run dev:phase4\n'); 