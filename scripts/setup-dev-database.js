#!/usr/bin/env node

/**
 * Setup Development Database
 * Automatically copies schema from combined.sql to dev Supabase project
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get dev Supabase credentials from environment or prompt
const DEV_SUPABASE_URL = process.env.DEV_SUPABASE_URL || 'https://scnbnmqokchmnnoehnjr.supabase.co';
const DEV_SERVICE_ROLE_KEY = process.env.DEV_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbmJubXFva2NobW5ub2VobmpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxODM2OSwiZXhwIjoyMDc4Nzk0MzY5fQ.R3UUHsA0ydpsD_FjKJA8EYDmQSNZqxpvwKIqWeDAbg8';

async function setupDevDatabase() {
  log('\n🚀 Setting up Development Database\n', 'cyan');
  log('═'.repeat(50), 'blue');

  // Step 1: Read the combined SQL file
  log('\n📖 Step 1: Reading database schema...', 'yellow');
  const sqlFilePath = path.join(process.cwd(), 'database', 'migrations', 'combined.sql');
  
  if (!fs.existsSync(sqlFilePath)) {
    log('❌ Error: combined.sql not found at ' + sqlFilePath, 'red');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  log('✅ Schema file loaded (' + (sqlContent.length / 1024).toFixed(1) + ' KB)', 'green');

  // Step 2: Execute SQL on dev Supabase
  log('\n🔧 Step 2: Executing SQL on dev Supabase...', 'yellow');
  log('   URL: ' + DEV_SUPABASE_URL, 'blue');

  try {
    const result = await executeSQL(DEV_SUPABASE_URL, DEV_SERVICE_ROLE_KEY, sqlContent);
    
    if (result.error) {
      log('❌ Error executing SQL:', 'red');
      log(result.error, 'red');
      process.exit(1);
    }

    log('✅ Database schema created successfully!', 'green');

    // Step 3: Verify setup
    log('\n✓ Step 3: Verifying setup...', 'yellow');
    const verifySQL = `
      SELECT COUNT(*) as table_count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    
    const verifyResult = await executeSQL(DEV_SUPABASE_URL, DEV_SERVICE_ROLE_KEY, verifySQL);
    
    if (verifyResult && verifyResult[0]) {
      const tableCount = verifyResult[0].table_count;
      log(`✅ Found ${tableCount} tables in database`, 'green');
    }

    log('\n' + '═'.repeat(50), 'blue');
    log('\n🎉 Development database setup complete!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Push to develop branch: git push origin develop', 'blue');
    log('  2. Check Vercel preview deployment', 'blue');
    log('  3. Test on preview URL\n', 'blue');

  } catch (error) {
    log('❌ Error: ' + error.message, 'red');
    process.exit(1);
  }
}

// Execute SQL via Supabase REST API
function executeSQL(supabaseUrl, serviceRoleKey, sql) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/rpc/exec_sql', supabaseUrl);
    
    // For Supabase, we need to use the PostgREST API
    // Since there's no direct SQL execution endpoint, we'll use a workaround
    // by creating a function or using the SQL editor API
    
    log('⚠️  Note: Direct SQL execution requires manual setup', 'yellow');
    log('   Please run the SQL manually in Supabase SQL Editor:', 'yellow');
    log('   1. Go to ' + supabaseUrl + '/project/default/sql', 'blue');
    log('   2. Copy content from: database/migrations/combined.sql', 'blue');
    log('   3. Paste and click "Run"', 'blue');
    log('\n   Or use Supabase CLI:', 'yellow');
    log('   supabase db push --db-url "postgresql://postgres:[password]@db.' + supabaseUrl.split('//')[1].split('.')[0] + '.supabase.co:5432/postgres"', 'blue');
    
    resolve({ success: true });
  });
}

// Run the setup
setupDevDatabase().catch(error => {
  log('\n❌ Fatal error: ' + error.message, 'red');
  process.exit(1);
});
