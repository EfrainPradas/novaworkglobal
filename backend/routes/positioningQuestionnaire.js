/**
 * Positioning Questionnaire API Routes
 * Handles the multi-section professional positioning questionnaire
 * and AI-powered profile generation
 */

import express from 'express'
import OpenAI from 'openai'
import { requireAuth } from '../middleware/auth.js'
import { supabase, supabaseAdmin } from '../services/supabase.js'

const router = express.Router()

// 🔒 Require authentication
router.use(requireAuth)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * GET /api/positioning-questionnaire
 * Returns the user's questionnaire data
 */
router.get('/positioning-questionnaire', async (req, res) => {
    try {
        const userId = req.user.id

        const { data, error } = await supabaseAdmin
            .from('positioning_questionnaire')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        return res.json({
            success: true,
            data: data || null
        })
    } catch (error) {
        console.error('Error fetching questionnaire:', error)
        res.status(500).json({
            error: 'Failed to fetch questionnaire',
            details: error.message
        })
    }
})

/**
 * PUT /api/positioning-questionnaire
 * Saves/updates questionnaire (supports partial updates)
 */
router.put('/positioning-questionnaire', async (req, res) => {
    try {
        const userId = req.user.id
        const questionnaireData = { ...req.body, user_id: userId }

        // Remove id if present to avoid conflicts
        delete questionnaireData.id
        delete questionnaireData.created_at
        delete questionnaireData.updated_at

        const { data: questionnaire, error: questionnaireError } = await supabaseAdmin
            .from('positioning_questionnaire')
            .upsert(questionnaireData, { onConflict: 'user_id' })
            .select()
            .single()

        if (questionnaireError) throw questionnaireError

        console.log(`✅ Questionnaire saved for user ${userId}`)

        return res.json({
            success: true,
            data: questionnaire
        })
    } catch (error) {
        console.error('Error saving questionnaire:', error)
        res.status(500).json({
            error: 'Failed to save questionnaire',
            details: error.message
        })
    }
})

/**
 * POST /api/positioning-questionnaire/generate-profile
 * AI-generates professional profile from questionnaire + accomplishment data
 * Generates 4 components: Identity, Blended Value, Competency, ATS Stack
 */
router.post('/positioning-questionnaire/generate-profile', async (req, res) => {
    try {
        const userId = req.user.id

        // 1. Fetch questionnaire data
        const { data: questionnaire, error: qError } = await supabaseAdmin
            .from('positioning_questionnaire')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (qError || !questionnaire) {
            return res.status(400).json({ error: 'Please complete the positioning questionnaire first.' })
        }

        // 2. Fetch accomplishments / story cards for context
        const { data: stories } = await supabaseAdmin
            .from('par_stories')
            .select('problem_challenge, result, competencies, role_company, skills_tags, title')
            .eq('user_id', userId)

        // 3. Fetch work experience for context
        // First get the master resume ID for this user
        const { data: resume } = await supabaseAdmin
            .from('user_resumes')
            .select('id')
            .eq('user_id', userId)
            .eq('is_master', true)
            .single()

        const masterResumeId = resume?.id

        const { data: workExp } = await supabaseAdmin
            .from('work_experience')
            .select('job_title, company_name, scope_description, role_explanation')
            .eq('resume_id', masterResumeId)
            .order('start_date', { ascending: false })
            .limit(5)

        // 4. Build AI prompt
        const storySummaries = (stories || []).map(s =>
            `- ${s.title || s.role_company}: ${s.problem_challenge} → ${s.result}`
        ).join('\n')

        const workSummaries = (workExp || []).map(w =>
            `- ${w.job_title} at ${w.company_name}: ${w.scope_description || w.role_explanation || 'N/A'}`
        ).join('\n')

        const prompt = `You are an expert Executive Resume Writer and Career Strategist.

Based on the following professional positioning questionnaire and career data, generate a 4-part Professional Profile Summary.

=== QUESTIONNAIRE DATA ===
Current Title: ${questionnaire.identity_current_title || 'Not specified'}
Target Title: ${questionnaire.identity_target_title || 'Not specified'}
One-Phrase Identity: ${questionnaire.identity_one_phrase || 'Not specified'}
Years Experience: ${questionnaire.years_experience_bucket || 'Not specified'}
Industries: ${(questionnaire.industries || []).join(', ') || 'Not specified'}
Environments: ${(questionnaire.environments || []).join(', ') || 'Not specified'}
Functions: ${(questionnaire.functions || []).join(', ') || 'Not specified'}
Trusted Problems: ${questionnaire.trusted_problems || 'Not specified'}
Impact Types: ${(questionnaire.impact_types || []).join(', ') || 'Not specified'}
Scale - Team Size: ${questionnaire.scale_team_size || 'N/A'}
Scale - Budget: ${questionnaire.scale_budget || 'N/A'}
Scale - Geo Scope: ${questionnaire.scale_geo_scope || 'N/A'}
Strengths: ${(questionnaire.strengths || []).join(', ') || 'Not specified'}
Complexity Moment: ${questionnaire.complexity_moment || 'N/A'}
How Colleagues Describe: ${questionnaire.colleagues_describe || 'N/A'}
Differentiator: ${questionnaire.differentiator || 'N/A'}
Technical Skills/Tools: ${(questionnaire.technical_skills_tools || []).join(', ') || 'N/A'}
Platforms/Systems: ${(questionnaire.platforms_systems || []).join(', ') || 'N/A'}
Methodologies: ${(questionnaire.methodologies || []).join(', ') || 'N/A'}
Languages Spoken: ${(questionnaire.languages_spoken || []).join(', ') || 'N/A'}
Stakeholder Exposure: ${(questionnaire.stakeholder_exposure || []).join(', ') || 'N/A'}

=== JOB DESCRIPTIONS (Target Roles) ===
${(questionnaire.job_descriptions || []).join('\n---\n') || 'None provided'}

=== KEY ACCOMPLISHMENTS ===
${storySummaries || 'No story cards available'}

=== RECENT WORK EXPERIENCE ===
${workSummaries || 'No work experience available'}

=== INSTRUCTIONS ===
CRITICAL TONE RULE: Write strictly in the telegraphic, implied third-person objective tone. ABSOLUTELY DO NOT use any personal pronouns in any language (e.g., "I", "me", "my", "we", "us", "he", "him", "his", "she", "her", "they", "Yo", "El", "Ella"). Start sentences directly with job titles, strong action verbs, or noun phrases (e.g., "Marketing Director with...", "Expert at building...", "Skilled at leading...").

Generate a structured professional profile in JSON format with exactly these 5 keys:

1. "identity_sentence": One powerful sentence following the template:
   "[Target Title] with [X+] years of experience in [Top 1-2 industries] operating across [environment/scope]."
   - Use the years_experience_bucket value.
   - Pick top 1-2 industries max.
   - Select 1-2 environments from the checklist.

2. "blended_value_sentence": One sentence following:
   "Expert in combining [Function1 + Function2 + Function3] to deliver [Primary Impact Type]."
   - Choose the most relevant impact type for the target title.

3. "competency_paragraph": 3-4 sentences that:
   - Incorporate selected strengths naturally
   - Reference the complexity_moment and scale data
   - Mention stakeholder_exposure if relevant
   - Sound executive, results-oriented, and ATS-friendly
   - Strict adherence to the no-pronoun rule. Never start a sentence with a pronoun.
   - Avoid generic buzzwords. Be specific about impact.

4. "areas_of_excellence": A pipe-separated string of 12-18 ATS keywords:
   - Extract from job_descriptions, platforms/tools/methodologies
   - Include frequently appearing skills_tags from story cards
   - Deduplicate and prioritize by relevance to target title
   - Format: "Keyword | Keyword | Keyword | ..."

5. "skills_section": An object with 3 arrays:
   - "tools_platforms": Technical tools and platforms
   - "methodologies": Frameworks and methodologies
   - "languages": Languages spoken

RETURN ONLY VALID JSON. No markdown, no code fences.`

        // 5. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are an expert executive resume writer. Output only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        })

        const result = JSON.parse(completion.choices[0].message.content)

        // 6. Determine version
        const { data: existingProfiles } = await supabaseAdmin
            .from('generated_professional_profile')
            .select('version')
            .eq('user_id', userId)
            .order('version', { ascending: false })
            .limit(1)

        const nextVersion = existingProfiles && existingProfiles.length > 0
            ? existingProfiles[0].version + 1
            : 1

        // 7. Save generated profile
        const profileData = {
            user_id: userId,
            questionnaire_id: questionnaire.id,
            output_identity_sentence: result.identity_sentence,
            output_blended_value_sentence: result.blended_value_sentence,
            output_competency_paragraph: result.competency_paragraph,
            output_areas_of_excellence: result.areas_of_excellence,
            output_skills_section: result.skills_section,
            edited_by_user: false,
            version: nextVersion
        }

        const { data: savedProfile, error: saveError } = await supabaseAdmin
            .from('generated_professional_profile')
            .insert(profileData)
            .select()
            .single()

        if (saveError) throw saveError

        console.log(`✅ Professional profile v${nextVersion} generated for user ${userId}`)

        return res.json({
            success: true,
            data: savedProfile,
            version: nextVersion
        })

    } catch (error) {
        console.error('Error generating professional profile:', error)
        res.status(500).json({ error: 'Failed to generate professional profile', details: error.message })
    }
})

/**
 * GET /api/positioning-questionnaire/generated-profiles
 * Returns all generated profile versions for the user
 */
router.get('/positioning-questionnaire/generated-profiles', async (req, res) => {
    try {
        const userId = req.user.id

        const { data, error } = await supabaseAdmin
            .from('generated_professional_profile')
            .select('*')
            .eq('user_id', userId)
            .order('version', { ascending: false })

        if (error) throw error

        return res.json({
            success: true,
            data: data || []
        })
    } catch (error) {
        console.error('Error fetching generated profiles:', error)
        res.status(500).json({ error: 'Failed to fetch generated profiles' })
    }
})

/**
 * PUT /api/positioning-questionnaire/generated-profile/:id
 * Updates a generated profile (user edits)
 */
router.put('/positioning-questionnaire/generated-profile/:id', async (req, res) => {
    try {
        const userId = req.user.id
        const profileId = req.params.id

        const updateData = { ...req.body, edited_by_user: true }
        delete updateData.id
        delete updateData.user_id
        delete updateData.created_at

        const { data, error } = await supabaseAdmin
            .from('generated_professional_profile')
            .update(updateData)
            .eq('id', profileId)
            .eq('user_id', userId)
            .select()
            .single()

        if (error) throw error

        return res.json({
            success: true,
            data
        })
    } catch (error) {
        console.error('Error updating generated profile:', error)
        res.status(500).json({ error: 'Failed to update generated profile' })
    }
})

export default router
