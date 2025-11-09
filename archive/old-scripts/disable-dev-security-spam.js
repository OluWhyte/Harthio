#!/usr/bin/env node

/**
 * Disable excessive security logging in development
 * This script helps reduce terminal spam during development
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Disabling excessive security logging for development...\n');

// Files to update
const filesToUpdate = [
  {
    file: 'src/lib/security-monitor.ts',
    changes: [
      {
        find: "console.error('[SECURITY ALERT]', JSON.stringify(alert, null, 2));",
        replace: "// Development: Reduced logging\n    if (process.env.NODE_ENV === 'production') {\n      console.error('[SECURITY ALERT]', JSON.stringify(alert, null, 2));\n    } else {\n      console.log(`[DEV SECURITY] ${alert.type}: ${alert.message}`);\n    }"
      },
      {
        find: "auth_failure: { count: 5, window: 15 * 60 * 1000 },",
        replace: "auth_failure: { count: process.env.NODE_ENV === 'production' ? 5 : 50, window: 15 * 60 * 1000 },"
      }
    ]
  },
  {
    file: 'src/lib/security-utils.ts',
    changes: [
      {
        find: "console.log('[SECURITY]', logEntry);",
        replace: "// Only log in production or when explicitly enabled\n  if (process.env.NODE_ENV === 'production' || process.env.ENABLE_SECURITY_LOGS === 'true') {\n    console.log('[SECURITY]', logEntry);\n  }"
      }
    ]
  }
];

let updatedFiles = 0;

filesToUpdate.forEach(({ file, changes }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let fileChanged = false;
  
  changes.forEach(({ find, replace }) => {
    if (content.includes(find)) {
      content = content.replace(find, replace);
      fileChanged = true;
      console.log(`✅ Updated: ${file}`);
    }
  });
  
  if (fileChanged) {
    fs.writeFileSync(filePath, content, 'utf8');
    updatedFiles++;
  }
});

console.log(`\n📊 Summary:`);
console.log(`   Files updated: ${updatedFiles}`);
console.log(`   Security logging: Reduced for development`);
console.log(`   Production logging: Unchanged`);

console.log(`\n🎯 What this does:`);
console.log(`   ✅ Reduces terminal spam in development`);
console.log(`   ✅ Keeps full security logging in production`);
console.log(`   ✅ Increases thresholds for dev environment`);
console.log(`   ✅ Makes development experience cleaner`);

console.log(`\n🔧 To re-enable full logging:`);
console.log(`   export ENABLE_SECURITY_LOGS=true`);
console.log(`   npm run dev`);

console.log(`\n✨ Restart your dev server to see the changes!`);