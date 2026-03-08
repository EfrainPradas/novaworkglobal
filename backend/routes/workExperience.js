import express from 'express'

import OpenAI from 'openai'

const router = express.Router()

// Use the existing OpenAI instance if possible, or initialize a new one
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

router.post('/generate-scope', async (req, res) => {
    try {
        const { aiForm, jobTitle } = req.body

        if (!aiForm) {
            return res.status(400).json({ error: 'Missing questionnaire data' })
        }

        const prompt = `You are an expert Executive Resume Writer.
Your task is to write a concise, powerful, 3-to-4-line Scope & Mandate statement for a ${jobTitle || 'professional'} based ONLY on the following questionnaire data.

=== QUESTIONNAIRE DATA ===
Core Mandate:
- Primary Action Verb: ${aiForm.core_mandate_verb || 'Not specified'}
- Objective: ${aiForm.core_mandate_objective || 'Not specified'}
- Creation Trigger: ${aiForm.core_mandate_trigger || 'Not specified'}
- Definition of Success: ${aiForm.core_mandate_success || 'Not specified'}

Financial Scope:
- Annual Spend / Managed: ${aiForm.fin_annual_spend || 'Not specified'}
- Revenue Impact: ${aiForm.fin_revenue_impact || 'Not specified'}
- P&L Ownership: ${aiForm.fin_pl_ownership || 'Not specified'}

Geographic Scope:
- Level: ${aiForm.geo_scope || 'Not specified'}
- Number of Countries: ${aiForm.geo_countries_count || 'Not specified'}
- Business Units: ${aiForm.geo_business_units || 'Not specified'}

Leadership Scope:
- Direct Reports: ${aiForm.lead_direct_reports || 'Not specified'}
- Total Team Size: ${aiForm.lead_total_team || 'Not specified'}
- Stakeholders: ${(aiForm.lead_stakeholders || []).join(', ') || 'Not specified'}

Ecosystem Complexity:
- Number Managed: ${aiForm.ecosystem_count || 'Not specified'}
- Names: ${aiForm.ecosystem_names || 'Not specified'}
- Categories/Portfolios: ${aiForm.ecosystem_categories || 'Not specified'}
- Brands: ${aiForm.ecosystem_brands || 'Not specified'}
- Technologies: ${aiForm.ecosystem_technologies || 'Not specified'}

Complexity Factors:
${(aiForm.complexity_factors || []).join(', ') || 'None specified'}

=== INSTRUCTIONS ===
- Do NOT use bullet points. Make it a single cohesive paragraph (3-4 lines).
- Start with the Primary Action Verb.
- Weave the financial size, team size, geography, and complexity seamlessly.
- CRITICAL: Write in the implied first-person objective tone (no pronouns). ABSOLUTELY DO NOT use "I", "me", "my", "we", "he", "him", "she", or "her". For example, write "Managed a team..." instead of "I managed a team..." or "He managed a team...".
- Output ONLY the text of the statement, nothing else. No intro, no quotes.
`

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // fast and economical for this task
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 300
        })

        const generatedText = response.choices[0]?.message?.content?.trim() || ""

        return res.json({ text: generatedText })

    } catch (error) {
        console.error('Scope generation error:', error)
        return res.status(500).json({ error: 'Internal Server Error', details: error.message })
    }
})

export default router
