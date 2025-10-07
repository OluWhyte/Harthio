const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Use service key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase environment variables not set. Make sure to set SUPABASE_SERVICE_KEY in your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sqlFiles = [
  'database/schema.sql',
  'database/setup-requests.sql',
  'database/setup-notifications.sql',
  'database/setup-webrtc.sql',
  'database/enable-realtime.sql'
];

async function deployDatabase() {
  try {
    for (const file of sqlFiles) {
      console.log(`Executing ${file}...`);
      const sql = fs.readFileSync(file, 'utf-8');
      const { error } = await supabase.rpc('query', { sql }); // Use a generic query RPC
      if (error) {
        console.error(`Error executing ${file}:`, error);
        process.exit(1);
      }
    }
    console.log('Database deployment completed successfully!');
  } catch (err) {
    console.error('An unexpected error occurred:', err);
    process.exit(1);
  }
}

// Create the 'query' function in Supabase before running this script.
// Go to SQL Editor in Supabase and run:
// CREATE OR REPLACE FUNCTION query(sql TEXT) RETURNS void AS $$
// BEGIN
//   EXECUTE sql;
// END;
// $$ LANGUAGE plpgsql;

deployDatabase();
