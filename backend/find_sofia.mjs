import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fytyfeapxgswxkecneom.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function findUser() {
    const { data: users, error } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('full_name', '%Sofia%Serrano%');

    if (error) {
        console.error("Error finding user:", error);
    } else {
        console.log("Users found:", users);
        if (users && users.length > 0) {
            const userId = users[0].id;
            console.log("User ID:", userId);

            const { data: storageFiles, error: storageError } = await supabase
                .storage
                .from('resumes')
                .list(userId);
            console.log("Storage files for user under /userId:", storageFiles, storageError);

            const { data: storageFilesRoot, error: storageErrorRoot } = await supabase
                .storage
                .from('resumes')
                .list();
            console.log("Some files in resumes bucket:", storageFilesRoot?.slice(0, 5));
        }
    }
}
findUser();
