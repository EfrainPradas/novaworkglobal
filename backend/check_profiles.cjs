const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: coaches } = await supabase.from('coach_profiles').select('*');
    if (coaches && coaches.length > 0) {
        const coachIds = coaches.map(c => c.user_id);

        const { data: users, error } = await supabase.from('users').select('*').in('id', coachIds);

        console.log(users);
    }
}
check();
