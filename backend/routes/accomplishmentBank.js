/**
 * Accomplishment Bank Routes
 * Handles AI-powered selection and management of accomplishments
 */

import express from 'express'
import { openai } from '../services/openai.js'
import { requireAuth } from '../middleware/auth.js'
import { supabase } from '../services/supabase.js'

const router = express.Router()

/**
 * POST /api/accomplishment-bank/auto-select
 * Selects the best accomplishments for a target job title using AI
 */
router.post('/auto-select', requireAuth, async (req, res) => {
    try {
        const { targetJobTitle, maxBullets = 5 } = req.body
        const userId = req.user.id

        if (!targetJobTitle) {
            return res.status(400).json({ error: 'Target job title is required' })
        }

        console.log(`🤖 AI Auto-Select initiated for: ${targetJobTitle}`)

        // 1. Fetch user's accomplishment bank
        const { data: bankItems, error } = await supabase
            .from('accomplishment_bank')
            .select('*')
            .eq('user_id', userId)

        if (error) throw error

        if (!bankItems || bankItems.length === 0) {
            return res.json({
                success: true,
                selectedItems: [],
                message: 'No accomplishments in bank to select from'
            })
        }

        console.log(`📚 Analyzing ${bankItems.length} accomplishments`)

        // 2. Prepare context for AI
        const bulletsContext = bankItems.map(item => ({
            id: item.id,
            text: item.bullet_text,
            role: item.role_title,
            skills: item.skills
        }))

        // 3. Call OpenAI to rank/select
        const prompt = `
    You are an expert Resume Strategist. 
    
    TASK: Select the top ${maxBullets} accomplishments from the user's bank that are MOST RELEVANT for a "${targetJobTitle}" role.
    
    CRITERIA:
    - Prioritize bullets with metrics and strong action verbs.
    - Match skills/keywords relevant to ${targetJobTitle}.
    - If a bullet is "starred" (not visible here, but assume general quality), it's good, but relevance matches are better.
    
    CANDIDATE'S ACCOMPLISHMENTS:
    ${JSON.stringify(bulletsContext, null, 2)}
    
    OUTPUT FORMAT:
    Return valid JSON with a single key "selectedIds" containing an array of strings (the IDs of the selected accomplishments).
    Example: { "selectedIds": ["uuid-1", "uuid-2"] }
    `

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a precise JSON-only API." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2
        })

        const responseContent = completion.choices[0].message.content
        const result = JSON.parse(responseContent)

        const selectedIds = result.selectedIds || []

        console.log(`✅ AI selected ${selectedIds.length} items`)

        // 4. Update "times_used" for selected items (optional, but good for tracking)
        // We won't await this to keep response fast
        if (selectedIds.length > 0) {
            // Increment usage count logic could go here
        }

        res.json({
            success: true,
            selectedIds,
            count: selectedIds.length
        })

    } catch (error) {
        console.error('❌ AI Auto-Select Error:', error)
        res.status(500).json({ error: 'Failed to auto-select accomplishments' })
    }
})

export default router
