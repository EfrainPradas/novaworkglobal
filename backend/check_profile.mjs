import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fytyfeapxgswxkecneom.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
    const userId = "79e00fb3-fc2f-4222-afe1-98319cd4a681"; // Sofia's ID
    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    console.log("Profile check error:", error);
    console.log("Profile:", profile);
}
checkUser();
