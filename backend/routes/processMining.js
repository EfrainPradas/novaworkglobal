import express from 'express'
import { OpenAI } from 'openai'

const router = express.Router()

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

/**
 * POST /api/process-mining/analyze-variants
 * Analyzes the top process variants and returns AI insights
 */
router.post('/analyze-variants', async (req, res) => {
    try {
        const { variants, kpis } = req.body

        if (!variants || !Array.isArray(variants)) {
            return res.status(400).json({ error: 'Variants array is required' })
        }

        console.log(`🤖 Analyzing ${variants.length} process variants with AI...`)

        const prompt = `
You are an expert Process Mining Data Analyst.
I am providing you with the top process variants (distinct paths users take) from our application's onboarding/funnel data, along with some global KPIs.

KPIs:
Total Sessions: ${kpis?.totalCases || 'N/A'}
Average Throughput Time: ${kpis?.avgThroughput || 'N/A'}

Top Variants:
${variants.map((v, i) => `Variant ${i + 1} (${v.total_events} steps, takes ${v.throughput_time_sec}s):
Path: ${v.variant_sequence.join(' -> ')}
`).join('\n')}

Analyze these variants and provide:
1. Executive Summary: What is the overall health of this process?
2. Happy Path Analysis: Identify the ideal path and comment on its efficiency.
3. Bottlenecks & Friction: Point out where users are looping, repeating steps, or taking too long (Rework).
4. Actionable Recommendations: What UX/UI changes should we make based on this data?

Format your response in clean Markdown with appropriate headings and bullet points. Keep it concise, professional, and directly applicable.
`

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a senior process mining analyst and UX researcher." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 1000
        })

        const analysis = completion.choices[0].message.content

        res.json({
            success: true,
            analysis
        })

    } catch (error) {
        console.error('❌ AI Variant Analysis Error:', error)
        res.status(500).json({
            error: 'Failed to analyze variants with AI',
            details: error.message
        })
    }
})

export default router
