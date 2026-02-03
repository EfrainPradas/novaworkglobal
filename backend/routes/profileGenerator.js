import express from 'express'
import OpenAI from 'openai'
import { supabase } from '../middleware/auth.js'

const router = express.Router()

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST /api/generate-profile
 * Generates a professional profile summary based on user PAR stories and competencies
 */
router.post('/generate-profile', async (req, res) => {
    try {
        const { userId } = req.body

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' })
        }

        // 1. Fetch User's PAR Stories to get context
        const { data: parStories, error: dbError } = await supabase
            .from('par_stories')
            .select('problem_challenge, action, result, competencies')
            .eq('user_id', userId)

        if (dbError) throw dbError

        if (!parStories || parStories.length === 0) {
            return res.status(400).json({ error: 'No PAR stories found. Please add stories first.' })
        }

        // 2. Aggregate competencies and stories
        const allCompetencies = new Set()
        const methodExamples = []

        parStories.forEach(story => {
            if (story.competencies) {
                story.competencies.forEach(c => allCompetencies.add(c))
            }
            methodExamples.push(`- Achieved: ${story.result} by ${story.action}`)
        })

        const competenciesList = Array.from(allCompetencies).join(', ')

        // 3. Construct Prompt
        const prompt = `
        You are an expert Career Coach and Resume Writer. 
        Create a high-impact Professional Profile Summary for a candidate based on their achievements.

        Candidate's Top Competencies: ${competenciesList}
        
        Key Achievements (PAR Stories):
        ${methodExamples.slice(0, 5).join('\n')}

        INSTRUCTIONS:
        Generate a structured professional profile in JSON format with 3 distinct parts.
        - Tone: Professional, confident, results-oriented.
        - Avoid generic buzzwords. Be specific about value/impact.
        - "whoYouAre": 1 sentence. Start with a strong professional title (infer it) and years of experience (state 'Experienced' if unknown).
        - "coreSkills": 1-2 sentences focusing on hard skills and technical expertise.
        - "softSkills": 1 sentence focusing on leadership, problem-solving, or soft skills value-add.
        - "areasOfExcellence": Extract the top 8 most relevant keywords/skills for an ATS.

        RETURN JSON FORMAT ONLY:
        {
            "whoYouAre": "string",
            "coreSkills": "string",
            "softSkills": "string",
            "areasOfExcellence": ["string", "string", ...]
        }
        `

        // 4. Call OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'You are a helpful expert resume writer that outputs JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7
        })

        const result = JSON.parse(completion.choices[0].message.content)

        return res.json({
            success: true,
            data: result
        })

    } catch (error) {
        console.error('Error generating profile:', error)
        res.status(500).json({ error: 'Failed to generate profile', details: error.message })
    }
})

export default router
