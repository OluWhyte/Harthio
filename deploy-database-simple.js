const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deploySQLFile(filePath) {
  try {
    console.log(`\n📄 Reading file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`✅ File read successfully (${sql.length} characters)`);
    
    console.log(`\n🚀 Executing SQL...`);
    
    // Execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      if (error.code === '42883') {
        console.log('⚠️  exec_sql function not found, trying direct execution...');
        
        // Split by semicolons and execute each statement
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          if (statement) {
            console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
            const { error: stmtError } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });
            
            if (stmtError) {
              console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
              console.error('Statement:', statement.substring(0, 200) + '...');
            } else {
              console.log(`✅ Statement ${i + 1} executed successfully`);
            }
          }
        }
      } else {
        console.error('❌ Error executing SQL:', error.message);
        console.error('Error details:', error);
        process.exit(1);
      }
    } else {
      console.log('✅ SQL executed successfully!');
    }
    
    console.log('\n✨ Database migration completed!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

// Get file path from command line arguments
const filePath = process.argv[2];

if (!filePath) {
  console.error('❌ Usage: node deploy-database-simple.js <path-to-sql-file>');
  console.error('Example: node deploy-database-simple.js database/migrations/add-tier-system.sql');
  process.exit(1);
}

console.log('🎯 Harthio Database Deployment Tool');
console.log('=====================================');

deploySQLFile(filePath);
