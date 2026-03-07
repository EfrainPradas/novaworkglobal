import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase
    .from('coaching_sessions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all rows

if (error) {
    console.error('Error:', error.message);
} else {
    console.log('All coaching sessions deleted successfully.');
}
