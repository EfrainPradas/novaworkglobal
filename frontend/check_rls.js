import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    'https://fytyfeapxgswxkecneom.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk'
);

const supabaseAnon = createClient(
    'https://fytyfeapxgswxkecneom.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzI3NTMsImV4cCI6MjA3ODY0ODc1M30.95IwWjhLEPkvaeHw5Izr3lD2TpbEO8fzGS_V2d2CpIY'
);

async function check() {
    const targetUser = "c1f53ebc-b8d1-42f1-8ed1-fd44e5ed4f4c";

    // Get all stories via Admin
    const { data: adminData } = await supabaseAdmin.from('par_stories').select('id, status, role_title');
    console.log(`Admin sees: ${adminData.length} total rows.`);

    // Create a JWT for the user to simulate RLS
    // Actually, we can just use the Service Role to sign a JWT, or we can use admin.auth.admin.generateLink or similar.
    // An easier way to test RLS blocks: Does the user have a resume_id? Wait, par_stories DOES NOT have resume_id constraint in RLS for viewing.
    // Wait, let's query the table's policies via Admin!
    const { data: policies, error } = await supabaseAdmin.rpc('get_policies', { table_name: 'par_stories' }).catch(() => ({ data: 'RPC failed' }));

    // Let's just query pg_policies!
    const { data: pgPolicies, error: pgError } = await supabaseAdmin
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'par_stories');

    if (pgError) {
        // If we can't query pg_policies via API (usually blocked), we need psql.
        console.log("Could not query pg_policies directly via API.");
    } else {
        console.log("Policies on par_stories:", pgPolicies);
    }
}
check();
