const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { Pool } = require('pg');

async function check() {
    // First let's check via RPC or pg_settings if we can't use db direct, but Supabase SDK doesn't always expose raw sql.
    // We can try to query pg_policies using service role key, if postgrest exposes it.
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Supabase REST endpoint doesn't expose pg_policies by default. 
    // Let's just create a test session to replicate the 403, and inspect the error.
    const { data, error } = await supabase.from('coaching_sessions').insert([{
        coach_client_id: '11111111-1111-1111-1111-111111111111', // dummy
        coach_id: '11111111-1111-1111-1111-111111111111',
        client_id: '22222222-2222-2222-2222-222222222222',
        session_type: 'Test',
        scheduled_at: new Date().toISOString(),
        duration_minutes: 60,
        status: 'scheduled'
    }]);

    console.log("Service role insert result:", error || data);
}
check();
