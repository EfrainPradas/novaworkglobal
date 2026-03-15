import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const uid = 'c1f53ebc-b8d1-42f1-8ed1-fd44e5ed4f4c';

async function run() {
  const {data:sk} = await s.from('user_skills').select('skill_name').eq('user_id', uid);
  console.log('=== user_skills ===');
  console.log(sk?.map(r => r.skill_name).join(', ') || 'NONE');

  const {data:int} = await s.from('user_interests').select('interest_name').eq('user_id', uid);
  console.log('\n=== user_interests ===');
  console.log(int?.map(r => r.interest_name).join(', ') || 'NONE');

  const {data:ob} = await s.from('onboarding_responses').select('skills, interests, values, current_situation, top_priority, target_job_title, values_reasoning').eq('user_id', uid).maybeSingle();
  console.log('\n=== onboarding_responses ===');
  if (ob) {
    for (const [k, v] of Object.entries(ob)) {
      if (v !== null) console.log(`  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    }
  } else console.log('  NONE');

  const {data:cvp} = await s.from('career_vision_profiles').select('career_vision_statement, core_values, skills_knowledge, interests, job_history_insights').eq('user_id', uid).order('created_at', {ascending:false}).limit(1).maybeSingle();
  console.log('\n=== career_vision_profiles (what Bruno reads) ===');
  if (cvp) {
    for (const [k, v] of Object.entries(cvp)) {
      const disp = v === null ? 'NULL' : (typeof v === 'object' ? JSON.stringify(v).substring(0,300) : String(v).substring(0,300));
      console.log(`  ${k}: ${disp}`);
    }
  } else console.log('  NONE');
}
run().catch(console.error);
