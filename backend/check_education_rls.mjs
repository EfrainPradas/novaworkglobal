import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking education table RLS...');
  
  // Check if table exists and columns
  const { data: cols, error: colError } = await supabase.from('education').select('*').limit(1);
  if (colError) {
    console.log('Error fetching education:', colError.message);
  } else {
    console.log('Education table exists. Columns:', Object.keys(cols[0] || {}).join(', '));
  }

  // Check policies
  const { data: policies, error: polError } = await supabase.rpc('get_policies', { table_name: 'education' });
  // Since I don't know if get_policies exists, I'll try to query pg_policies directly if possible, 
  // but Supabase JS doesn't allow direct system table queries easily via .from().
  // I'll try a common RPC if it exists, or just use a generic query to see if RLS is enabled.
  
  const { data: rlsCheck, error: rlsError } = await supabase.from('education').select('id').limit(1);
  console.log('RLS Check (select):', rlsError ? rlsError.message : 'Success');
}

check();
