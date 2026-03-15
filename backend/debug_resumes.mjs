import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const userId = '3fa11ed4-e9e5-4fdc-9ee8-f002e935ef3d'

async function debug() {
  const { data: resumes } = await supabase
    .from('user_resumes')
    .select('id, is_master, resume_type, created_at')
    .eq('user_id', userId)
  
  console.log('--- Resumes ---')
  resumes?.forEach(r => {
    console.log(`ID: ${r.id} | Master: ${r.is_master} | Type: ${r.resume_type} | Created: ${r.created_at}`)
  })

  for (const r of (resumes || [])) {
    const { data: work } = await supabase
      .from('work_experience')
      .select('company_name, job_title')
      .eq('resume_id', r.id)
    console.log(`\nResume ${r.id} has ${work?.length || 0} work experiences:`)
    work?.forEach(w => console.log(`  - ${w.company_name}: ${w.job_title}`))
  }
}

debug()
