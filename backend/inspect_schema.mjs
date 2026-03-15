import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const tables = [
    'career_vision_profiles',
    'positioning_questionnaire',
    'generated_professional_profile',
    'onboarding_responses'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        console.log(`[${table}] Error: ${error.message}`);
      } else if (data && data.length > 0) {
        console.log(`[${table}] Columns: ${Object.keys(data[0]).sort().join(', ')}`);
      } else {
        console.log(`[${table}] No data found.`);
      }
    } catch (e) {
      console.log(`[${table}] Exception: ${e.message}`);
    }
  }
}

check();
