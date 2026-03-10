import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data, error } = await supabase
        .from('saved_accomplishment_groups')
        .select('id')
        .limit(1);

    if (error) {
        console.error('Table check error:', error.message);
        if (error.code === '42P01') {
            console.log('RESULT: Table does not exist');
        } else {
            console.log('RESULT: Error accessing table');
        }
    } else {
        console.log('RESULT: Table exists');
    }
}

run();
