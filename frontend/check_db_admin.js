import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    'https://fytyfeapxgswxkecneom.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk'
);

async function check() {
    console.log("Querying database as Admin with select('*')...");
    const { data, error } = await supabaseAdmin.from('par_stories').select('*');
    if (error) {
        console.error('Error fetching all columns:', error);
        return;
    }

    console.log(`Total par_stories fetched successfully: ${data.length}`);
    const targetUser = "c1f53ebc-b8d1-42f1-8ed1-fd44e5ed4f4c";
    const userStories = data.filter(s => s.user_id === targetUser);
    console.log(`Stories for user ${targetUser}: ${userStories.length}`);
}

check();
