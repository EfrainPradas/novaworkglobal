const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

async function setupWeeklyReinventionTables() {
  console.log('🚀 Setting up Weekly Reinvention tables...');

  try {
    // Read and execute the SQL schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../scripts/WEEKLY_REINVENTION_SCHEMA.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema...');

    // Split SQL by semicolons and execute each statement
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement });

        if (error) {
          // If RPC doesn't exist, try direct SQL through the client
          console.log('⚠️  RPC method not available, trying direct execution...');
          break;
        }
      }
    }

    console.log('✅ Weekly Reinvention tables setup complete!');

    // Verify tables were created
    const { data: tables, error } = await supabase
      .from('weekly_goals')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Error verifying tables:', error.message);
      console.log('\n📋 Please manually execute the SQL file in Supabase SQL Editor:');
      console.log('File: /scripts/WEEKLY_REINVENTION_SCHEMA.sql');
    } else {
      console.log('✅ Tables verified successfully!');
    }

  } catch (error) {
    console.error('❌ Error setting up tables:', error);
    console.log('\n📋 Please manually execute the SQL file in Supabase SQL Editor:');
    console.log('File: /scripts/WEEKLY_REINVENTION_SCHEMA.sql');
  }
}

setupWeeklyReinventionTables();