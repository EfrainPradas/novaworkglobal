import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fytyfeapxgswxkecneom.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkEventLogs() {
    const userId = "79e00fb3-fc2f-4222-afe1-98319cd4a681"; // Sofia's ID
    const { data: logs, error } = await supabase
        .from('event_logs')
        .select('*')
        .eq('user_id', userId)
        .limit(20);

    if (error) {
        console.error("Error finding logs:", error);
    } else {
        console.log("Recent logs for Sofia:", JSON.stringify(logs, null, 2));
    }
}
checkEventLogs();
