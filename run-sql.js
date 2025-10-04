const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
require("dotenv").config({ path: ".env.local" });

async function runSQL(filename) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const sql = fs.readFileSync(filename, "utf8");
    console.log(`Running SQL from ${filename}...`);

    // Split SQL into individual statements and run them
    const statements = sql.split(";").filter((stmt) => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmed = statement.trim();
      if (trimmed) {
        console.log(`Executing: ${trimmed.substring(0, 100)}...`);
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: trimmed,
        });

        if (error) {
          console.error("Error executing statement:", error);
          console.error("Statement was:", trimmed);
        } else {
          console.log("✓ Statement executed successfully");
        }
      }
    }

    console.log("✅ SQL execution completed");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

const filename = process.argv[2];
if (!filename) {
  console.error("Usage: node run-sql.js <filename.sql>");
  process.exit(1);
}

runSQL(filename);
