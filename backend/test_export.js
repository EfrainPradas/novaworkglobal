import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testEdu() {
    try {
        const userId = 'c1f53ebc-b8d1-42f1-8ed1-fd44e5ed4f4c';
        const { data: edu } = await supabase
            .from('education')
            .select('*')
            .eq('user_id', userId);
            
        fs.writeFileSync('edu.txt', JSON.stringify(edu, null, 2));
        console.log("Wrote edu.txt");
    } catch(e) { console.error(e); }
}
testEdu();
