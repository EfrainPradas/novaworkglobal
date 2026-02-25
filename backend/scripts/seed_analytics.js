
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

// Load .env from potential locations
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPaths = [
    path.join(__dirname, '../../.env'), // Root from script
    path.join(process.cwd(), '.env'),   // Root from execution
    path.join(__dirname, '../.env')     // Backend root
]

envPaths.forEach(p => dotenv.config({ path: p }))

console.log('Context:', {
    cwd: process.cwd(),
    hasUrl: !!process.env.SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_KEY || !!process.env.SUPABASE_ANON_KEY
})

if (!process.env.SUPABASE_URL) {
    console.error('❌ FATAL: SUPABASE_URL is missing from environment.')
    process.exit(1)
}

// Initialize Supabase Admin
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    // Ideally Service Key for seeding, but Anon key might work if RLS allows or if we validly auth. 
    // We'll try. If RLS blocks, we need service key.
)

async function seed() {
    console.log('🌱 Seeding analytics data...')

    // 1. Create Dummy Users (Auth + Profiles)
    // We can't easily creating Auth users without admin API, let's just insert into 'user_profiles' if it allows (often RLS blocks).
    // Actually, for "Counting", we just need rows.

    // Let's generate 150 fake UUIDs
    const fakeUsers = Array.from({ length: 150 }).map((_, i) => ({
        user_id: crypto.randomUUID(),
        full_name: `User ${i}`,
        target_job_title: 'Software Engineer',
        experience_level: 'Senior'
    }))

    // Batch insert users (chunks of 50)
    // Note: This relies on user_profiles not enforcing foreign key strictly to auth.users OR us having the key.
    // Use upsert to be safe.
    try {
        const { error: userError } = await supabase.from('user_profiles').upsert(fakeUsers.slice(0, 50), { onConflict: 'user_id', ignoreDuplicates: true })
        if (userError) console.warn('⚠️ Could not seed profiles (RLS?):', userError.message)
        else console.log('✅ Seeded 50+ users')

        // 2. Create Resumes
        const fakeResumes = fakeUsers.slice(0, 100).flatMap(u => [
            { user_id: u.user_id, profile_summary: 'Experienced dev...', created_at: new Date().toISOString() },
            { user_id: u.user_id, profile_summary: 'Manager role...', created_at: new Date().toISOString() }
        ])

        const { error: resumeError } = await supabase.from('user_resumes').upsert(fakeResumes, { ignoreDuplicates: true })
        if (resumeError) console.warn('⚠️ Could not seed resumes:', resumeError.message)
        else console.log('✅ Seeded 200+ resumes')

        // 3. Create Hired/Interviews
        const fakeInterviews = fakeUsers.slice(0, 25).map(u => ({
            user_id: u.user_id,
            company_name: 'Tech Corp',
            position_title: 'Developer',
            status: 'hired',
            interview_date: new Date().toISOString()
        }))

        const { error: interviewError } = await supabase.from('interview_preparations').upsert(fakeInterviews, { ignoreDuplicates: true })
        if (interviewError) console.warn('⚠️ Could not seed interviews:', interviewError.message)
        else console.log('✅ Seeded 25 hired interviews')

    } catch (err) {
        console.error('❌ Seed failed:', err)
    }
}

seed()
