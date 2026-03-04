require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase.from('par_stories').select('id, user_id, status, role_title');
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total stories in DB: ${data.length}`);

    // Count by status
    const byStatus = data.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Stories by status:', byStatus);

    // Count by user_id
    const byUser = data.reduce((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] || 0) + 1;
        return acc;
    }, {});
    console.log('Stories by user_id:', byUser);

    console.log('Sample data (first 3):', JSON.stringify(data.slice(0, 3), null, 2));
}

check();
