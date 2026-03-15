import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function applyMigration(filePath) {
  console.log(`Applying migration: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Note: supabase-js doesn't have a direct .query() or .sql() method.
  // We usually have to use an RPC that can execute SQL, but that's a security risk and 
  // often not available in production environments for safety.
  // However, for this task, I'll check if there's a common 'exec_sql' or similar RPC, 
  // or I'll just inform the user if I can't apply it programmatically.
  
  // In this workspace, let's check if we can run it via a specific tool or if we need to ask the user.
  // Wait, I see migrations being applied in previous session summaries. 
  // I will try to use the `supabase` utility if it's available in the shell.
  console.log('SQL to apply (manually if needed):\n', sql);
  
  try {
    // Attempting to run SQL via a common pattern if it exists
    const { data, error } = await supabase.rpc('apply_sql', { sql_query: sql });
    if (error) {
      console.error('Error applying migration via RPC:', error.message);
      return false;
    }
    console.log('Migration applied successfully via RPC.');
    return true;
  } catch (e) {
    console.error('Exception applying migration:', e.message);
    return false;
  }
}

const migrationPath = path.join(process.cwd(), '../supabase/migrations/20260315000001_fix_education_rls.sql');
applyMigration(migrationPath);
