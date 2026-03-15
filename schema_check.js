const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './backend/.env' });
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
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
  ];

  for (const table of tables) {
    const { data, error } = await sb.from(table).select('*').limit(1);
    if (error) {
      console.log(table + ': ERROR — ' + error.message);
    } else if (!data || data.length === 0) {
      console.log(table + ': EMPTY TABLE (cols unknown from empty result)');
    } else {
      console.log(table + ': ' + JSON.stringify(Object.keys(data[0])));
    }
  }

  const { data: usersData } = await sb.from('users').select('id').limit(3);
  if (usersData) {
    console.log('SAMPLE public.users IDs:', usersData.map(function(u) { return u.id; }));
  }
}

run().catch(console.error);
