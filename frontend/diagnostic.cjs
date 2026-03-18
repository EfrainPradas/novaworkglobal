
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    'https://fytyfeapxgswxkecneom.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzA3Mjc1MywiZXhwIjoyMDc4NjQ4NzUzfQ.uK5RfckYWDcIVXaCVd08NLIoGamG6b5XPw5A3AsT0gk'
);

async function run() {
    const results = {};

    // 1. Find Efrain Prada's user_id
    const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .ilike('full_name', '%Efrain Prada%');
    
    if (userError) {
        results.userError = userError;
    } else {
        results.efrainUsers = users;
        if (users.length > 0) {
            const efrainId = users[0].id;
            results.efrainId = efrainId;

            // 2. Fetch his education
            const { data: edu } = await supabase.from('education').select('*').eq('user_id', efrainId);
            results.education = edu;

            // 3. Fetch his certs
            const { data: certs } = await supabase.from('certifications').select('*').eq('user_id', efrainId);
            results.certifications = certs;

            // 4. Fetch his awards
            const { data: awards } = await supabase.from('awards').select('*').eq('user_id', efrainId);
            results.awards = awards;
            
            // 5. Check if he has any resumes
            const { data: resumes } = await supabase.from('user_resumes').select('*').eq('user_id', efrainId);
            results.resumes = resumes;
        }
    }

    fs.writeFileSync('diagnostic_results.json', JSON.stringify(results, null, 2));
    console.log('Diagnostic results saved to diagnostic_results.json');
}

run();
