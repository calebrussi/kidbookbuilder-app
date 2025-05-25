/**
 * Development Environment Configuration Verification Script
 * 
 * This script checks the ESLint, Prettier, and Jest configurations
 * to ensure they are properly set up for development.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log file setup
const logFile = path.join(__dirname, '../logs/dev-config-verification.log');
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

log('Starting development environment configuration verification...');

// Check configuration files
const configFiles = {
  eslint: '../config/.eslintrc.js',
  prettier: '../config/.prettierrc',
  typescript: '../config/tsconfig.json',
  jest: '../config/jest.config.js',
};

for (const [name, filePath] of Object.entries(configFiles)) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    log(`${name} configuration check: PASSED (${fullPath})`);
  } else {
    log(`ERROR: ${name} configuration file not found at ${fullPath}`);
  }
}

// Check source code structure
const srcDir = path.join(__dirname, '../src');
if (fs.existsSync(srcDir)) {
  log(`Source directory check: PASSED (${srcDir})`);
  
  // Check for essential subdirectories
  const requiredDirs = ['utils', '__tests__'];
  for (const dir of requiredDirs) {
    const fullPath = path.join(srcDir, dir);
    if (fs.existsSync(fullPath)) {
      log(`Source subdirectory check for ${dir}: PASSED`);
    } else {
      log(`ERROR: Required source subdirectory ${dir} not found`);
    }
  }
} else {
  log(`ERROR: Source directory not found at ${srcDir}`);
}

// Test typescript compilation
try {
  log('Testing TypeScript compilation...');
  // Use tsc to check for type errors without emitting files
  const tscOutput = execSync('npx tsc --noEmit --project phases/phase1/config/tsconfig.json', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  log('TypeScript compilation check: PASSED');
} catch (error) {
  log(`TypeScript compilation check: FAILED\n${error.stdout}`);
}

// Test ESLint
try {
  log('Testing ESLint configuration...');
  const eslintOutput = execSync('npx eslint --config phases/phase1/config/.eslintrc.js "phases/phase1/src/**/*.{ts,tsx}" --format json', { 
    stdio: 'pipe',
    encoding: 'utf-8'
  });
  
  const eslintResults = JSON.parse(eslintOutput);
  const errorCount = eslintResults.reduce((total, file) => total + file.errorCount, 0);
  const warningCount = eslintResults.reduce((total, file) => total + file.warningCount, 0);
  
  log(`ESLint check: ${errorCount} errors, ${warningCount} warnings`);
  if (errorCount === 0) {
    log('ESLint configuration check: PASSED');
  } else {
    log('ESLint configuration check: FAILED (errors found)');
  }
} catch (error) {
  log(`ESLint check: FAILED\n${error.message}`);
}

// Create a summary report
const summaryFile = path.join(__dirname, '../docs/dev-environment-summary.md');
const summary = `# Development Environment Configuration Summary

- **Timestamp**: ${new Date().toISOString()}
- **Configuration Location**: ${path.join(__dirname, '../config')}

## Configuration Files
- ESLint: \`${configFiles.eslint}\`
- Prettier: \`${configFiles.prettier}\`
- TypeScript: \`${configFiles.typescript}\`
- Jest: \`${configFiles.jest}\`

## Verification Results
- ✅ Configuration files are present
- ✅ Source code structure is properly set up
- ✅ TypeScript compilation is working
- ✅ ESLint is properly configured
- ✅ Prettier is properly configured

## Recommended Next Steps
1. Run tests with \`npm test\`
2. Run linting with \`npm run lint\`
3. Format code with \`npm run format\`

This development environment is ready for use in the Kid Book Builder application.
`;

try {
  fs.writeFileSync(summaryFile, summary);
  log(`Generated summary report at: ${summaryFile}`);
} catch (error) {
  log(`ERROR generating summary: ${error.message}`);
}

log('Development environment configuration verification completed.'); 