import dotenv from 'dotenv';
dotenv.config();

// 1. Intent classification test
const { classifyIntent } = await import('./services/agent/intentClassifier.js');
const tests = [
  'describeme mi vision de carrera',
  'describe my career vision',
  'what is my vision',
  'mi perfil profesional',
  'my values',
  'my strengths',
  'where do i start',
  'help with resume',
];
console.log('INTENT TESTS:');
for (const msg of tests) {
  console.log(`  [${classifyIntent(msg)}] <= "${msg}"`);
}
console.log('---');

// 2. Context assembly test
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: users } = await supabase.from('users').select('id, email').eq('email', 'efrain.pradas@gmail.com').limit(1);
const userId = users[0].id;
console.log('USER:', users[0].email, userId);

const { assembleContext } = await import('./services/agent/contextAssembler.js');
const result = await assembleContext(userId, 'client', 'career_vision_content');
console.log('CONTEXT KEYS:', Object.keys(result.context));
console.log('HAS career_vision:', !!result.context.career_vision);
console.log('HAS positioning:', !!result.context.positioning);
console.log('HAS professional_profile:', !!result.context.professional_profile);
console.log('HAS onboarding:', !!result.context.onboarding);

if (result.context.career_vision) {
  const cv = result.context.career_vision;
  console.log('CV statement:', (cv.career_vision_statement || 'NULL').substring(0, 200));
}

// 3. Prompt content section test
const { buildContentSection } = await import('./services/agent/promptBuilder.js');
const section = buildContentSection(result.context);
console.log('CONTENT SECTION LENGTH:', section.length);
console.log('FIRST 500 CHARS:', section.substring(0, 500));
