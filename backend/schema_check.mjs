import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const tables = [
  'par_stories',
  'accomplishment_bank',
  'user_resumes',
  'users',
  'coaching_sessions',
  'event_logs',
  'coaching_goals',
  'client_pipeline',
  'par_accomplishments',
  'generated_professional_profile',
  'positioning_questionnaire',
  'onboarding_responses',
  'career_vision_profiles',
  'coach_clients',
  'interview_preparations',
  'interview_question_answers',
  'job_applications',
  'networking_contacts',
  'auto_reminders',
  'work_experience',
  'accomplishments',
];

for (const table of tables) {
  const { data, error } = await sb.from(table).select('*').limit(1);
  if (error) {
    console.log(`${table}: ERROR — ${error.message}`);
  } else if (!data || data.length === 0) {
    console.log(`${table}: EMPTY TABLE`);
  } else {
    console.log(`${table}: ${JSON.stringify(Object.keys(data[0]))}`);
  }
}

// Identity check
const { data: authUsers } = await sb.from('users').select('id').limit(3);
console.log('SAMPLE public.users IDs:', JSON.stringify(authUsers?.map(u => u.id)));
