const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Try to load .env from current dir or backend/
const envPath = fs.existsSync('.env') ? '.env' : path.join(__dirname, '.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_KEY missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Running migration: Adding label column to academy_nodes...');
  
  // Using a direct SQL execution via RPC if the 'exec_sql' function exists
  // Or just use a simple insert to check connectivity first
  try {
    const { data, error } = await supabase.from('academy_nodes').select('id, label').limit(1);
    
    if (error && error.message.includes('column "label" does not exist')) {
      console.log('Column "label" does not exist. Please run the SQL manually in Supabase Dashboard:');
      console.log('ALTER TABLE academy_nodes ADD COLUMN IF NOT EXISTS label TEXT;');
    } else if (error) {
           console.error('Query failed:', error.message);
    } else {
      console.log('Column "label" already exists or query succeeded.');
    }
  } catch (err) {
    console.error('Unexpected error:', err.message);
  }
  
  process.exit(0);
}

run();
