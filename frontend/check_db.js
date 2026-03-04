import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function check() {
    const { data, error } = await supabase.from('par_stories').select('id, user_id, status, role_title, source_type');
    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Total stories in DB visible: ${data.length}`);

    const byStatus = data.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, {});
    console.log('Stories by status:', byStatus);

    const byUser = data.reduce((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] || 0) + 1;
        return acc;
    }, {});
    console.log('Stories by user_id:', byUser);
    console.log('Sample data:', data.slice(0, 5));
}

check();
