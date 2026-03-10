import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fytyfeapxgswxkecneom.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixSofiaProfile() {
    const authId = "79e00fb3-fc2f-4222-afe1-98319cd4a681";

    // First query auth users to get her details
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error("Auth error:", authError);
        return;
    }

    const sofia = users.find(u => u.id === authId);
    if (!sofia) {
        console.error("Sofia not found in Auth!");
        return;
    }

    console.log("Found Sofia in Auth:", sofia.email);

    // Insert into user_profiles
    const { data: profile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
            id: authId,
            user_id: authId,
            full_name: 'Sofia Serrano',
            email: sofia.email,
            is_onboarding_completed: false, // Force her to do onboarding if needed, or set true
            has_seen_career_vision_prompt: false
        })
        .select();

    if (insertError) {
        console.error("Error creating profile:", insertError);
    } else {
        console.log("Successfully created missing profile for Sofia:", profile);
    }
}
fixSofiaProfile();
