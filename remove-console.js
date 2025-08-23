const fs = require('fs');
const path = require('path');

// Function to remove console statements
function removeConsoleStatements(content) {
  // Remove console.log, console.error, console.warn, console.trace statements
  // But keep the structure intact
  return content
    .replace(/\s*console\.(log|error|warn|info|trace|debug)\([^;]*\);?\s*\n?/g, '')
    .replace(/^\s*\/\/\s*Debug:.*\n?/gm, '') // Remove debug comments
    .replace(/^\s*\/\/\s*Debug logging.*\n?/gm, '') // Remove debug logging comments
    .replace(/\/\/\s*Debug:.*$/gm, '') // Remove inline debug comments
    .replace(/\/\/\s*Enhanced debugging.*$/gm, '') // Remove enhanced debugging comments
    .replace(/\/\/\s*Log.*for debugging.*$/gm, '') // Remove log for debugging comments
    // Clean up extra empty lines that might be left
    .replace(/\n\s*\n\s*\n/g, '\n\n');
}

// Function to process a directory recursively
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!['node_modules', '.git', 'build', 'dist', 'coverage'].includes(item)) {
        processDirectory(fullPath);
      }
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
      // Skip DebugText.tsx as we already handled it
      if (item === 'DebugText.tsx') {
        continue;
      }
      
      console.log(`Processing: ${fullPath}`);
      
      // Read file
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Remove console statements
      const cleanedContent = removeConsoleStatements(content);
      
      // Only write if content changed
      if (cleanedContent !== content) {
        fs.writeFileSync(fullPath, cleanedContent, 'utf8');
        console.log(`  ✓ Cleaned console statements from ${fullPath}`);
      }
    }
  }
}

// Start processing from src directory
const srcPath = path.join(__dirname, 'src');
console.log('Starting console cleanup...');
processDirectory(srcPath);
console.log('Console cleanup completed!');
