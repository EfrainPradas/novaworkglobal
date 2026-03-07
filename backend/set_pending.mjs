import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Get the most recent session ID
const { data: sessions } = await supabase
    .from('coaching_sessions')
    .select('id, session_type, status')
    .order('created_at', { ascending: false })
    .limit(1);

console.log('Latest session:', sessions);

// Update it to pending
if (sessions && sessions.length > 0) {
    const { data, error } = await supabase
        .from('coaching_sessions')
        .update({ status: 'pending' })
        .eq('id', sessions[0].id)
        .select();

    console.log('Updated to pending:', error || data);
}
