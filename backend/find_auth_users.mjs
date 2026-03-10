import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fytyfeapxgswxkecneom.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findAuthUsers() {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error) {
        console.error("Error finding users:", error);
    } else {
        const sofia = users.filter(u => JSON.stringify(u).toLowerCase().includes('sofia'));
        console.log("Users matching Sofia in auth.users:", sofia.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata })));

        console.log("Total auth users:", users.length);
        const latest = [...users].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
        console.log("Latest auth users:", latest.map(u => ({ id: u.id, email: u.email, metadata: u.user_metadata, created_at: u.created_at })));
    }
}
findAuthUsers();
