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
      positioning: questionnaire || null,
      language: req.body.language || null
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
 * POST /api/ai/personalized-examples
 * Fetch personalized CAR examples based on user professional context
 */
router.post('/personalized-examples', async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`🤖 Fetching personalized examples for user: ${userId}`)

    // 1. Fetch Context
    const [parStories, workExp, positioning] = await Promise.all([
      supabase.from('par_stories').select('role_title').eq('user_id', userId).limit(5),
      supabase.from('work_experience').select('job_title').eq('user_id', userId).order('start_date', { ascending: false }).limit(3),
      supabase.from('positioning_questionnaire').select('identity_target_title, industries').eq('user_id', userId).maybeSingle()
    ])

    // 2. Extract Roles
    const roles = new Set()
    if (parStories.data) parStories.data.forEach(s => s.role_title && roles.add(s.role_title))
    if (workExp.data) workExp.data.forEach(w => w.job_title && roles.add(w.job_title))
    
    const background = {
      target_title: positioning.data?.identity_target_title,
      industries: positioning.data?.industries
    }

    // 3. Generate Examples
    const { getPersonalizedCARExamples } = await import('../services/openai.js')
    const examples = await getPersonalizedCARExamples(Array.from(roles), background)

    res.json({
      success: true,
      examples
    })

  } catch (error) {
    console.error('❌ Error in /personalized-examples:', error)
    res.status(500).json({ error: 'Failed to fetch personalized examples', details: error.message })
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
 * POST /api/ai/improve-bullet
 * Improve an accomplishment bullet with AI
 */
router.post('/improve-bullet', async (req, res) => {
  try {
    const { bullet_text } = req.body;

    if (!bullet_text || typeof bullet_text !== 'string' || bullet_text.trim().length < 5) {
      return res.status(400).json({ error: 'bullet_text is required and must be at least 5 characters' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert resume writer. Improve the given accomplishment bullet point to make it more impactful, specific, and results-oriented.
Rules:
- IMPORTANT: Respond in the SAME LANGUAGE as the input text. If the input is in Spanish, respond in Spanish. If in English, respond in English. If in Portuguese, respond in Portuguese, etc.
- Start with a strong action verb
- Add quantifiable results if implied (use realistic estimates if none are given)
- Keep it concise (1-2 sentences max)
- Use professional language
- Return ONLY the improved bullet point text, no explanation, no quotes, no prefix`
        },
        {
          role: 'user',
          content: bullet_text.trim()
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const improved = completion.choices[0]?.message?.content?.trim();
    if (!improved) throw new Error('No response from AI');

    res.json({ success: true, improved_text: improved });

  } catch (error) {
    console.error('❌ Error in /improve-bullet:', error);
    res.status(500).json({ error: 'Failed to improve bullet', details: error.message });
  }
})

/**
 * POST /api/ai/improve-car
 * Improve a full CAR (Context/Challenge, Action, Results) story using AI
 * Enforces CAR methodology: quantified results with % or numbers
 */
router.post('/improve-car', async (req, res) => {
  try {
    const { role_title, company_name, problem_challenge, actions, result, language } = req.body;

    if (!problem_challenge || !actions || !result) {
      return res.status(400).json({ error: 'problem_challenge, actions, and result are required' });
    }

    const actionsText = Array.isArray(actions) ? actions.filter(a => a?.trim()).join('\n- ') : actions;

    const prompt = `You are an expert executive career coach specializing in the CAR methodology (Context/Challenge → Action → Result). Your task is to rewrite and improve the following CAR story so it is compelling, specific, and fully quantified.

CRITICAL LANGUAGE RULE: Detect the language of the input text (Context/Challenge, Actions, Result). Write ALL output — improved_challenge, improved_actions, improved_result, AND key_improvements — in the EXACT SAME LANGUAGE as the input. If the input is in Spanish, respond entirely in Spanish. If English, respond in English. Never switch languages.

CAR METHODOLOGY RULES (NON-NEGOTIABLE):
1. CONTEXT/CHALLENGE: Clearly state the business problem, situation, or opportunity. Include scope (team size, budget, timeframe, market conditions) when relevant.
2. ACTION: Use powerful, specific action verbs. Describe WHAT the person did and HOW — include specific methods, tools, or strategies. Use bullet points for multiple actions.
3. RESULT: ALWAYS include quantified outcomes using real numbers or percentages. Every result MUST have at least one metric (%, $, time saved, headcount, revenue, efficiency gain, NPS score, etc.). If the original lacks numbers, infer realistic estimates based on the context and mark them with "(est.)".

STYLE RULES:
- Use executive-level language with strong action verbs appropriate to the detected language
- Be specific and concrete — no vague language
- Keep each section concise but complete
- Results must be measurable and impressive

INPUT CAR:
Role: ${role_title || 'N/A'} at ${company_name || 'N/A'}
Context/Challenge: ${problem_challenge}
Actions:
- ${actionsText}
Result: ${result}

OUTPUT FORMAT (respond with valid JSON only, all values in the SAME language as the input):
{
  "improved_challenge": "...",
  "improved_actions": ["...", "...", "..."],
  "improved_result": "...",
  "key_improvements": ["...", "...", "..."]
}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `You are an expert executive career coach. YOU MUST RESPOND IN ${(language || 'English').toUpperCase()} ONLY. Every field in the JSON must be written in ${language || 'English'}. Always respond with valid JSON only. No markdown, no explanation outside JSON.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error('No response from AI');

    // Parse JSON response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON response from AI');
    const improved = JSON.parse(jsonMatch[0]);

    res.json({ success: true, improved });

  } catch (error) {
    console.error('❌ Error in /improve-car:', error);
    res.status(500).json({ error: 'Failed to improve CAR', details: error.message });
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