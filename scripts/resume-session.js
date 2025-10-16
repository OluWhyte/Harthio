#!/usr/bin/env node

/**
 * Resume Session Helper
 * Quickly shows current project state and incomplete tasks
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 HARTHIO SESSION RESUME HELPER\n');

// Check for incomplete files
function checkIncompleteFiles() {
  const patterns = [
    /\/\*\*[\s\S]*?(?!\*\/)/g, // Unclosed comments
    /export\s*$/gm, // Incomplete exports
    /function\s+\w+\s*\(\s*$/gm, // Incomplete functions
    /class\s+\w+\s*\{?\s*$/gm, // Incomplete classes
  ];

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
  
  console.log('📁 CHECKING FOR INCOMPLETE FILES...\n');
  
  let incompleteFiles = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      patterns.forEach((pattern, index) => {
        const matches = content.match(pattern);
        if (matches) {
          incompleteFiles.push({
            file: relativePath,
            issue: getIssueDescription(index),
            matches: matches.length
          });
        }
      });
      
      // Check for very short files (likely incomplete)
      if (content.trim().length < 50 && content.trim().length > 0) {
        incompleteFiles.push({
          file: relativePath,
          issue: 'Very short file (possibly incomplete)',
          matches: 1
        });
      }
      
    } catch (error) {
      console.log(`❌ Error reading ${file}: ${error.message}`);
    }
  });
  
  if (incompleteFiles.length === 0) {
    console.log('✅ No incomplete files detected!\n');
  } else {
    console.log('🚧 INCOMPLETE FILES FOUND:\n');
    incompleteFiles.forEach(item => {
      console.log(`   📄 ${item.file}`);
      console.log(`      Issue: ${item.issue}`);
      console.log(`      Count: ${item.matches}\n`);
    });
  }
  
  return incompleteFiles;
}

function getIssueDescription(patternIndex) {
  const descriptions = [
    'Unclosed comment block',
    'Incomplete export statement',
    'Incomplete function definition',
    'Incomplete class definition'
  ];
  return descriptions[patternIndex] || 'Unknown issue';
}

function getAllFiles(dir, extensions) {
  let files = [];
  
  try {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files = files.concat(getAllFiles(fullPath, extensions));
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  } catch (error) {
    console.log(`❌ Error reading directory ${dir}: ${error.message}`);
  }
  
  return files;
}

// Check build status
function checkBuildStatus() {
  console.log('🔨 CHECKING BUILD STATUS...\n');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npm run typecheck', { stdio: 'pipe' });
    console.log('✅ TypeScript: PASSING\n');
  } catch (error) {
    console.log('❌ TypeScript: FAILING');
    console.log('   Run `npm run typecheck` for details\n');
  }
  
  try {
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build: PASSING\n');
  } catch (error) {
    console.log('❌ Build: FAILING');
    console.log('   Run `npm run build` for details\n');
  }
}

// Show recent commits
function showRecentWork() {
  console.log('📝 RECENT WORK (Last 3 commits)...\n');
  
  const { execSync } = require('child_process');
  
  try {
    const commits = execSync('git log --oneline -3', { encoding: 'utf8' });
    console.log(commits);
  } catch (error) {
    console.log('❌ Could not fetch git history\n');
  }
}

// Main execution
async function main() {
  console.log(`📅 Session started at: ${new Date().toLocaleString()}\n`);
  
  // Check for progress tracker
  const progressFile = path.join(process.cwd(), 'PROGRESS_TRACKER.md');
  if (fs.existsSync(progressFile)) {
    console.log('📋 Progress tracker found! Check PROGRESS_TRACKER.md for details.\n');
  } else {
    console.log('⚠️  No progress tracker found. Consider creating one.\n');
  }
  
  showRecentWork();
  checkBuildStatus();
  const incompleteFiles = checkIncompleteFiles();
  
  console.log('🎯 RECOMMENDED NEXT ACTIONS:\n');
  
  if (incompleteFiles.length > 0) {
    console.log('1. 🔧 Fix incomplete files first');
    console.log('2. 🧪 Run tests to ensure stability');
    console.log('3. 📝 Update progress tracker');
  } else {
    console.log('1. 📋 Check PROGRESS_TRACKER.md for next tasks');
    console.log('2. 🚀 Continue with planned improvements');
    console.log('3. 🧪 Run tests after changes');
  }
  
  console.log('\n✨ Ready to continue development!\n');
}

main().catch(console.error);