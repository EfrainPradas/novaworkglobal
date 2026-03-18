const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
// Find dotenv relative to script
dotenv.config({ path: '/Ubuntu/home/efraiprada/novaworkglobal/active/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
    // 1. Get user id for efraiprada
    const { data: users, error: uErr } = await supabase.from('users').select('id, email, full_name').ilike('email', '%efrain.prada%');
    console.log("Users:", users);
    
    if (users && users.length > 0) {
        const uid = users[0].id;
        
        // 2. Check user_resumes
        console.log("--- USER RESUMES ---");
        const { data: resumes } = await supabase.from('user_resumes').select('id, is_master, profile_summary, created_at').eq('user_id', uid).order('created_at', { ascending: false });
        resumes.forEach(r => {
            console.log(`Resume ID: ${r.id}, Master: ${r.is_master}, Created: ${r.created_at}`);
            console.log(`Summary snippet: ${r.profile_summary ? r.profile_summary.substring(0, 50) : 'NULL'}...`);
        });

        // 3. Check generated_professional_profile
        console.log("--- GENERATED PROFILES ---");
        const { data: genProfiles } = await supabase.from('generated_professional_profile').select('*').eq('user_id', uid).order('version', { ascending: false });
        genProfiles.forEach(gp => {
            console.log(`Version: ${gp.version}, Hook: ${gp.output_identity_sentence ? gp.output_identity_sentence.substring(0, 50) : 'NULL'}...`);
        });
    }
}

checkData();
