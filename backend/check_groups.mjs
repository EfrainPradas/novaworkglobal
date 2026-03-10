import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data: user } = await supabase.from('users').select('id').eq('email', 'efrain.pradas@gmail.com').single();
    if (!user) return console.log('User not found');

    const { data: groups } = await supabase.from('saved_accomplishment_groups').select('id, name, grouped_data').eq('user_id', user.id);
    console.log('User has', groups?.length || 0, 'saved groups');
    if (groups?.length > 0) {
        console.log('First group:', groups[0].name, 'with', groups[0].grouped_data.length, 'categories');
    } else {
        const dummyData = [
            { groupName: 'Test Leadership', accomplishments: ['Led a cross-functional team of 10 to deliver project X', 'Mentored 3 junior developers'] },
            { groupName: 'Test Technical', accomplishments: ['Architected a scalable microservices backend', 'Optimized database queries reducing latency by 40%'] }
        ];
        await supabase.from('saved_accomplishment_groups').insert({ user_id: user.id, name: 'Sample Tech Layout', grouped_data: dummyData });
        console.log('Created dummy group for testing');
    }
}
run();
