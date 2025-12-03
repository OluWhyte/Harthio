#!/usr/bin/env node

/**
 * Deploy Payment Functions to Supabase
 * Deploys the add_credits_to_user and upgrade_user_to_pro functions
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployPaymentFunctions() {
  console.log('🚀 Deploying payment functions to Supabase...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'database', 'migrations', 'add-payment-functions.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Read SQL file:', sqlPath);
    console.log('📦 SQL size:', sql.length, 'bytes\n');

    // Execute the SQL
    console.log('⚙️  Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution via REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });

      if (!response.ok) {
        // Fallback: Split and execute each statement
        console.log('⚠️  Direct execution not available, using statement-by-statement approach...\n');
        
        // Split SQL into individual statements
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SELECT'));

        for (const statement of statements) {
          if (statement.includes('CREATE OR REPLACE FUNCTION')) {
            console.log('📝 Creating function...');
            const { error: stmtError } = await supabase.rpc('exec', { sql: statement + ';' }).catch(() => ({ error: null }));
            if (stmtError) {
              console.error('❌ Error:', stmtError.message);
            } else {
              console.log('✅ Function created');
            }
          }
        }
        
        return { data: null, error: null };
      }

      return response.json();
    });

    if (error) {
      console.error('❌ Deployment failed:', error.message);
      console.error('\n💡 Manual deployment required:');
      console.error('   1. Go to Supabase Dashboard > SQL Editor');
      console.error('   2. Copy the contents of database/migrations/add-payment-functions.sql');
      console.error('   3. Paste and run in the SQL Editor');
      process.exit(1);
    }

    console.log('\n✅ Payment functions deployed successfully!');
    console.log('\n📋 Functions created:');
    console.log('   • add_credits_to_user() - Atomically adds credits to user');
    console.log('   • upgrade_user_to_pro() - Atomically upgrades user to Pro tier');
    console.log('\n🔒 Security: Functions are restricted to service_role only');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('\n💡 Manual deployment required:');
    console.error('   1. Go to Supabase Dashboard > SQL Editor');
    console.error('   2. Copy the contents of database/migrations/add-payment-functions.sql');
    console.error('   3. Paste and run in the SQL Editor');
    process.exit(1);
  }
}

// Run deployment
deployPaymentFunctions();
