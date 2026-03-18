const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '../backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Testing education query with order_index...');
    const { data: d1, error: e1 } = await supabase.from('education').select('*').order('order_index', {ascending: true}).limit(1);
    if (e1) console.error('Error with order_index:', e1.message);

    console.log('Testing education query with created_at...');
    const { data: d2, error: e2 } = await supabase.from('education').select('*').order('created_at', {ascending: false}).limit(1);
    if (e2) console.error('Error with created_at:', e2.message);

    console.log('Testing education query with graduation_year...');
    const { data: d3, error: e3 } = await supabase.from('education').select('*').order('graduation_year', {ascending: false}).limit(1);
    if (e3) {
        console.error('Error with graduation_year:', e3.message);
    } else {
        console.log('Success with graduation_year! Columns found:', Object.keys(d3[0] || {}));
    }
}

checkSchema();
