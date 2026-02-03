/**
 * Cover Letter Generation Routes
 * AI-powered cover letter generation for job applications
 */

import express from 'express'
import OpenAI from 'openai'
import { requireAuth, supabase, supabaseAdmin } from '../middleware/auth.js'

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key'
})

const router = express.Router()

/**
 * GET /api/cover-letter/health
 * Health check for cover letter service
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Cover Letter Generator',
        timestamp: new Date().toISOString()
    })
})

/**
 * POST /api/cover-letter/generate
 * Generate personalized cover letter using AI
 */
router.post('/generate', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        console.log(`📝 Generating cover letter for user: ${userId}`)

        const {
            jobTitle,
            companyName,
            jobDescription,
            tone = 'professional',
            highlights = []
        } = req.body

        if (!jobTitle || !companyName) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: 'jobTitle and companyName are required'
            })
        }

        // Fetch user's resume data
        const { data: resume } = await supabase
            .from('user_resumes')
            .select('id, full_name, profile_summary, areas_of_excellence, email, phone, city, state, country, linkedin_url')
            .eq('user_id', userId)
            .eq('is_master', true)
            .maybeSingle()

        // Fetch profile data as fallback
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('full_name, email, phone_number, location')
            .eq('user_id', userId)
            .single()

        // Helper to parse name from email
        const getNameFromEmail = (email) => {
            if (!email) return 'Candidate Name'
            try {
                const localPart = email.split('@')[0]
                return localPart
                    .split(/[._-]/)
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(' ')
            } catch (e) {
                return 'Candidate Name'
            }
        }

        console.log('👤 User Metadata Debug:', JSON.stringify(req.user, null, 2))

        const email = resume?.email || profile?.email || req.user.email
        const rawName = resume?.full_name || profile?.full_name || req.user.metadata?.full_name || req.user.metadata?.name

        // Consolidate contact info
        const contactInfo = {
            name: rawName || getNameFromEmail(email) || 'Candidate Name',
            email: email || 'email@example.com',
            phone: resume?.phone || profile?.phone_number || 'Phone Number',
            location: resume?.city && resume?.state
                ? `${resume.city}, ${resume.state}`
                : (resume?.country || profile?.location || 'City, State')
        }

        // Current Date
        const today = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        // Fetch work experience
        let experienceText = ''
        if (resume?.id) {
            const { data: workExperience } = await supabase
                .from('work_experience')
                .select('job_title, company_name, scope_description')
                .eq('resume_id', resume.id)
                .order('start_date', { ascending: false })
                .limit(3)

            if (workExperience && workExperience.length > 0) {
                experienceText = workExperience.map(exp =>
                    `${exp.job_title} at ${exp.company_name}: ${exp.scope_description || ''}`
                ).join('\n')
            }
        }

        // Build prompt
        const userContext = `
CANDIDATE INFO:
Name: ${contactInfo.name}
Email: ${contactInfo.email}
Phone: ${contactInfo.phone}
Location: ${contactInfo.location}
Current Date: ${today}

SUMMARY: ${resume?.profile_summary || 'N/A'}
SKILLS: ${resume?.areas_of_excellence?.join(', ') || 'N/A'}
EXPERIENCE: ${experienceText}
HIGHLIGHTS: ${highlights.join(', ')}
`

        const prompt = `Write a cover letter for a ${jobTitle} position at ${companyName}.
Tone: ${tone}.
Context: ${userContext}
Job Description: ${jobDescription || 'Standard role'}

IMPORTANT:
1. HEADER: Use the exact Current Date provided above (${today}).
2. HEADER: Use the exact Candidate Name provided above (${contactInfo.name}).
3. HEADER: Use the exact Email provided.
4. If Phone or Location is "Phone Number" or "City, State", OMIT that line entirely.
5. Do NOT use placeholders like [Your Name], [Date], [Address]. Use real data or omit.`

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert cover letter writer.' },
                { role: 'user', content: prompt }
            ]
        })

        const coverLetterText = completion.choices[0].message.content.trim()

        res.json({
            success: true,
            coverLetter: coverLetterText,
            metadata: {
                jobTitle,
                companyName,
                generatedAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('❌ Error generating cover letter:', error)
        res.status(500).json({
            error: 'Failed to generate cover letter',
            details: error.message
        })
    }
})

/**
 * POST /api/cover-letter/save
 */
router.post('/save', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { jobTitle, companyName, jobDescription, coverLetterText, tone } = req.body

        const { data, error } = await supabaseAdmin
            .from('cover_letters')
            .insert({
                user_id: userId,
                job_title: jobTitle,
                company_name: companyName,
                job_description: jobDescription,
                cover_letter_text: coverLetterText,
                tone: tone || 'professional'
            })
            .select()
            .single()

        if (error) throw error

        res.json({ success: true, coverLetter: data })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

/**
 * GET /api/cover-letter/list
 */
router.get('/list', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id
        const { data, error } = await supabase
            .from('cover_letters')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error
        res.json({ success: true, coverLetters: data || [] })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

export default router
