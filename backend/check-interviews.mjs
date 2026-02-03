import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.backend' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Buscar interviews con ese ID específico
const { data: specificInterview, error: specError } = await supabase
  .from('interview_preparations')
  .select('id, user_id, position_title, company_name')
  .eq('id', 'f552ff98-479d-41eb-876a-f86d195d5a27')
  .maybeSingle();

console.log('\n=== Interview ID específico ===');
if (specificInterview) {
  console.log('Found:', JSON.stringify(specificInterview, null, 2));
} else {
  console.log('❌ Interview f552ff98-479d-41eb-876a-f86d195d5a27 NO EXISTE en la base de datos');
}

// Buscar todos los interviews
const { data: allInterviews } = await supabase
  .from('interview_preparations')
  .select('id, user_id, position_title, company_name, created_at')
  .limit(10)
  .order('created_at', { ascending: false });

console.log('\n=== Últimos 10 interviews en la base de datos ===');
allInterviews?.forEach((int, idx) => {
  console.log(`${idx + 1}. ID: ${int.id}`);
  console.log(`   User ID: ${int.user_id}`);
  console.log(`   Position: ${int.position_title || 'N/A'}`);
  console.log(`   Company: ${int.company_name || 'N/A'}`);
  console.log('');
});

process.exit(0);
