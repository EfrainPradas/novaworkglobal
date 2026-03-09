/**
 * AI Accomplishments Routes
 * Handles AI-powered accomplishments generation for PAR Stories
 */

import express from 'express'
import { generateAccomplishments, groupAccomplishments } from '../services/openai.js'
import { requireAuth, supabase, supabaseAdmin } from '../middleware/auth.js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-not-set'
})

const router = express.Router()

// 🔒 Security: Require authentication for all routes in this file
router.use(requireAuth)

/**
 * POST /api/ai/generate-accomplishments
 * Generate AI-powered accomplishments from PAR story data
 *
 * Request body:
 * {
 *   "challenge": "Problem or challenge description",
 *   "result": "Result achieved",
 *   "role_company": "Role and company context",
 *   "skills": ["skill1", "skill2"],
 *   "competencies": ["Leadership", "Technical/Engineering"]
 * }
 */
router.post('/generate-accomplishments', async (req, res) => {
  try {
    console.log('🚀 Received request to generate accomplishments')
    console.log('Request body:', JSON.stringify(req.body, null, 2))

    const {
      challenge,
      result,
      role_company,
      role_title,
      company_name,
      skills,
      competencies
    } = req.body

    // Map new fields to legacy role_company if they exist
    const mappedRoleCompany = role_title && company_name
      ? `${role_title} at ${company_name}`
      : role_company;

    // Validate required fields
    if (!challenge || !result) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Both challenge and result are required'
      })
    }

    // Validate field lengths
    if (typeof challenge !== 'string' || challenge.length < 10) {
      return res.status(400).json({
        error: 'Invalid challenge field',
        details: 'Challenge must be at least 10 characters long'
      })
    }

    if (typeof result !== 'string' || result.length < 10) {
      return res.status(400).json({
        error: 'Invalid result field',
        details: 'Result must be at least 10 characters long'
      })
    }

    // Fetch Positioning Questionnaire for context
    const { data: questionnaire } = await supabase
      .from('positioning_questionnaire')
      .select('*')
      .eq('user_id', req.user.id)
      .maybeSingle()

    // Generate accomplishments using AI
    const accomplishments = await generateAccomplishments({
      challenge,
      result,
      role_company: mappedRoleCompany || '',
      skills: Array.isArray(skills) ? skills : [],
      competencies: Array.isArray(competencies) ? competencies : [],
      positioning: questionnaire || null
    })

    console.log('✅ Accomplishments generated successfully')

    // Return the generated accomplishments
    res.json({
      success: true,
      accomplishments,
      count: accomplishments.length
    })

  } catch (error) {
    console.error('❌ Error generating accomplishments:', error)

    // Return appropriate error response
    res.status(500).json({
      error: 'Failed to generate accomplishments',
      details: error.message,
      // Include fallback accomplishments if available
      fallback_accomplishments: [
        "Successfully delivered measurable business impact through strategic execution and problem-solving",
        "Demonstrated leadership and technical expertise to achieve exceptional project outcomes",
        "Collaborated effectively with stakeholders to drive positive change and achieve organizational goals"
      ]
    })
  }
})

/**
 * POST /api/ai/group-accomplishments
 * Group accomplishments into categories based on a user prompt
 */
router.post('/group-accomplishments', async (req, res) => {
  try {
    const { accomplishments, prompt } = req.body;

    if (!Array.isArray(accomplishments) || accomplishments.length === 0) {
      return res.status(400).json({ error: 'Accomplishments array is required' });
    }

    const groups = await groupAccomplishments(accomplishments, prompt);

    res.json({ success: true, groups });

  } catch (error) {
    console.error('❌ Error in /group-accomplishments:', error);
    res.status(500).json({ error: 'Failed to group accomplishments', details: error.message });
  }
})

/**
 * GET /api/ai/health
 * Health check for AI services
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Accomplishments Generator',
    timestamp: new Date().toISOString(),
    features: [
      'AI-powered accomplishments generation',
      'PAR story integration',
      'Career Vision skills integration'
    ]
  })
})

/**
 * POST /api/ai/generate-answers
 * Generate AI answers for interview questions based on user's resume
 */
router.post('/generate-answers', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`🤖 Generating interview answers for user: ${userId}`)
    console.log(`📦 Request body: ${JSON.stringify(req.body)}`)

    // 1. Fetch User Profile & Resume Data
    // We need: Job Title, Work Experience, Skills (from resume tables)

    // Get basic profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('target_job_title, experience_level, full_name')
      .eq('user_id', userId)
      .single()

    const targetJob = profile?.target_job_title || 'Professional'

    // Get latest resume ID
    const { data: resume } = await supabase
      .from('user_resumes')
      .select('id, profile_summary, areas_of_excellence')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let contextText = `Candidate Name: ${profile?.full_name || 'Candidate'}
Target Role: ${targetJob}
Experience Level: ${profile?.experience_level || 'Not specified'}`

    if (resume) {
      // Get work experience
      const { data: experience } = await supabase
        .from('work_experience')
        .select('company_name, job_title, scope_description, start_date, end_date')
        .eq('resume_id', resume.id)
        .order('start_date', { ascending: false })
        .limit(3)

      contextText += `\n\nProfessional Summary: ${resume.profile_summary || 'N/A'}
Core Skills: ${resume.areas_of_excellence ? resume.areas_of_excellence.join(', ') : 'N/A'}

Recent Experience:
${experience ? experience.map(exp => `- ${exp.job_title} at ${exp.company_name}: ${exp.scope_description || ''}`).join('\n') : 'No experience listed'}`
    }

    console.log(`📄 Built context for AI (${contextText.length} chars)`)

    // 2. Identify questions that need answers
    // We prioritize "difficult" questions or general ones if no answers exist
    // If a specific questionId is provided in body, we only generate for that one
    const targetQuestionId = req.body.questionId

    let questionsToAnswer = []

    if (targetQuestionId) {
      // Fetch specific question
      const { data: q } = await supabase
        .from('interview_questions')
        .select('id, question_text, question_category')
        .eq('id', targetQuestionId)
        .single()

      if (q) questionsToAnswer = [q]
    } else {
      // Batch mode (existing logic)
      const { data: questions } = await supabase
        .from('interview_questions')
        .select('id, question_text, question_category')
        .eq('is_active', true)
        .limit(5) // Generate 5 at a time to avoid timeout

      // Check which ones already have answers
      const { data: existingAnswers } = await supabase
        .from('interview_question_answers')
        .select('question_id')
        .eq('user_id', userId)

      const answeredIds = new Set(existingAnswers?.map(a => a.question_id) || [])
      questionsToAnswer = questions?.filter(q => !answeredIds.has(q.id)) || []
    }

    if (questionsToAnswer.length === 0) {
      return res.json({ success: true, message: 'No questions to generate answers for', generatedCount: 0 })
    }

    console.log(`🎯 Generating answers for ${questionsToAnswer.length} questions`)

    const prompt = `You are a world-class Interview Coach. Generate a SHORT, CONCISE, and PUNCHY first-person interview answer.

CANDIDATE PROFILE:
${contextText}

INSTRUCTIONS:
- Style: Natural, conversational, and direct. 
- Tone: Professional but NOT exaggerated or overly formal. Avoid corporate jargon or "perfect" sounding flowery language.
- Structure: Follow the STAR/PAR method (Problem, Action, Result) but keep it brief.
- Length: STRICTLY under 100 words. Focus on the most impactful actions and results.
- Constraint: Do not include introductory or concluding remarks. Just the answer.

QUESTION TO ANSWER:
${questionsToAnswer.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}

OUTPUT FORMAT:
Return a JSON object with a key "answers" containing an array of objects. Each object must have "question_index" (1-based) and "answer_text".
Example: {"answers": [{"question_index": 1, "answer_text": "In my last role at X, I noticed Y. I implemented Z, which resulted in a 20% improvement..."}]}`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a concise AI interview coach. You provide realistic, non-exaggerated answers." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content
    console.log(`🤖 AI Response Received: ${responseContent}`)

    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseContent)
    } catch (e) {
      console.error('❌ Failed to parse AI response as JSON:', e)
      return res.status(500).json({ error: 'AI returned invalid JSON', details: String(responseContent) })
    }

    let answersArray = parsedResponse.answers || (Array.isArray(parsedResponse) ? parsedResponse : null)

    // Fallback: If it's a single object with the right fields, wrap it in an array
    if (!answersArray && parsedResponse.answer_text) {
      answersArray = [parsedResponse]
    }

    if (!answersArray) {
      console.error('❌ AI response format error:', JSON.stringify(parsedResponse))
      return res.status(500).json({ error: 'AI response format error', details: JSON.stringify(parsedResponse) })
    }

    // 4. Save answers to database
    let savedCount = 0
    let lastGeneratedAnswer = null

    console.log(`💾 Processing ${answersArray.length} items from AI`)

    for (const item of answersArray) {
      const qIndex = (item.question_index || item.index || 1) - 1
      console.log(`🔍 Item question_index: ${item.question_index}, mapping to qIndex: ${qIndex}`)

      if (questionsToAnswer[qIndex]) {
        const question = questionsToAnswer[qIndex]
        console.log(`📝 Upserting answer for: ${question.question_text.substring(0, 30)}`)

        try {
          const { data: savedAnswer, error: saveError } = await supabaseAdmin
            .from('interview_question_answers')
            .upsert({
              user_id: userId,
              question_id: question.id,
              answer_text: item.answer_text || item.answer,
              confidence_level: 3,
              needs_improvement: true,
              improvement_notes: 'Generated by AI based on your profile. Review and personalize.'
            }, { onConflict: 'user_id, question_id' })
            .select()
            .single()

          if (saveError) {
            console.error(`❌ DB Error for ${question.id}:`, JSON.stringify(saveError))
          } else {
            lastGeneratedAnswer = savedAnswer
            savedCount++
            console.log(`✅ Saved ID: ${savedAnswer.id}`)
          }
        } catch (err) {
          console.error(`❌ Exception for ${question.id}:`, err.message)
        }
      } else {
        console.warn(`⚠️ No question at index ${qIndex}`)
      }
    }

    console.log(`🏁 Total saved: ${savedCount}`)

    if (savedCount === 0 && targetQuestionId) {
      return res.status(500).json({ error: 'Failed to save generated answer', details: 'Check backend logs for database errors' })
    }

    res.json({
      success: true,
      generatedCount: savedCount,
      message: `Generated ${savedCount} answers`,
      answer: lastGeneratedAnswer
    })

  } catch (error) {
    console.error('❌ Error generating interview answers:', error)
    res.status(500).json({
      error: 'Failed to generate answers',
      details: error.message
    })
  }
})

export default router