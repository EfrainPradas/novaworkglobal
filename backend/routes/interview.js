/**
 * Interview Mastery System™ Routes
 * STEP 3: Interview Preparation & Strategy
 * API endpoints for interview preparation, practice, and follow-up
 */

import express from 'express'
import { requireAuth, supabase, supabaseAdmin } from '../middleware/auth.js'
import OpenAI from 'openai'

const router = express.Router()

// Initialize OpenAI (API key from env)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-not-set'
})

// All Interview routes require authentication
router.use(requireAuth)

// ============================================
// INTERVIEW PREPARATIONS (Main Entity)
// ============================================

/**
 * POST /api/interviews/generate-answers
 * Generate AI answers for interview questions based on user's resume
 */
router.post('/generate-answers', async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`🤖 Generating interview answers for user: ${userId}`)

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

    // 3. Generate answers using OpenAI
    const prompt = `You are an expert Interview Coach. Generate a personalized, first-person interview answer for the following candidate.

CANDIDATE PROFILE:
${contextText}

INSTRUCTIONS:
- Write in the first person ("I").
- Use the STAR/PAR method (Problem, Action, Result) implicitly.
- Be professional, confident, and specific.
- Reference the candidate's actual experience from the profile provided.
- Keep answers concise (approx 100-150 words).

QUESTIONS TO ANSWER:
${questionsToAnswer.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}

OUTPUT FORMAT:
Return a valid JSON array of objects, each with "question_index" (1-based) and "answer_text".
Example: [{"question_index": 1, "answer_text": "I believe..."}]`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI interview coach." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content
    const parsedResponse = JSON.parse(responseContent)
    const answersArray = parsedResponse.answers || parsedResponse // Handle both {answers: [...]} and [...] formats if API varies

    // 4. Save answers to database
    let savedCount = 0
    let lastGeneratedAnswer = null

    if (Array.isArray(answersArray)) {
      for (const item of answersArray) {
        const qIndex = item.question_index - 1
        if (questionsToAnswer[qIndex]) {
          const question = questionsToAnswer[qIndex]

          const { data: savedAnswer } = await supabaseAdmin
            .from('interview_question_answers')
            .upsert({
              user_id: userId,
              question_id: question.id,
              answer_text: item.answer_text,
              confidence_level: 3,
              needs_improvement: true,
              improvement_notes: 'Generated by AI based on your profile. Review and personalize.'
            }, { onConflict: 'user_id, question_id' })
            .select()
            .single()

          lastGeneratedAnswer = savedAnswer
          savedCount++
        }
      }
    }

    console.log(`✅ Successfully generated and saved ${savedCount} answers`)

    res.json({
      success: true,
      generatedCount: savedCount,
      message: `Generated ${savedCount} new personalized answers`,
      answer: lastGeneratedAnswer // Return the answer if called for a single question
    })

  } catch (error) {
    console.error('❌ Error generating interview answers:', error)
    res.status(500).json({
      error: 'Failed to generate answers',
      details: error.message
    })
  }
})

/**
 * GET /api/interviews
 * Get all interview preparations for the user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`🎯 Fetching interview preparations for user: ${userId}`)

    const { data, error } = await supabase
      .from('interview_preparations')
      .select('*')
      .eq('user_id', userId)
      .order('interview_date', { ascending: false, nullsFirst: false })

    if (error) throw error

    console.log(`✅ Found ${data.length} interview preparations`)

    res.json({
      success: true,
      interviews: data
    })

  } catch (error) {
    console.error('❌ Error fetching interview preparations:', error)
    res.status(500).json({
      error: 'Failed to fetch interview preparations',
      details: error.message
    })
  }
})

/**
 * GET /api/interviews/:id
 * Get a specific interview preparation with all related data
 */
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`🔍 Fetching interview preparation: ${interviewId}`)

    // Get interview preparation
    const { data: interview, error } = await supabase
      .from('interview_preparations')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Get related research
    const { data: research } = await supabase
      .from('interview_research')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    // Get JD comparisons with PAR stories
    const { data: jdComparisons } = await supabase
      .from('jd_comparison_analysis')
      .select(`
        *,
        par_story:par_stories(*)
      `)
      .eq('interview_prep_id', interviewId)
      .order('order_index', { ascending: true })

    // Get practice sessions
    const { data: practiceSessions } = await supabase
      .from('interview_practice_sessions')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('practice_date', { ascending: false })

    // Get session notes
    const { data: sessionNotes } = await supabase
      .from('interview_session_notes')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    // Get thank you notes
    const { data: thankYouNotes } = await supabase
      .from('thank_you_notes')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('created_at', { ascending: false })

    // Get follow-ups
    const { data: followups } = await supabase
      .from('interview_followups')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('followup_date', { ascending: true })

    // Get negotiation prep
    const { data: negotiationPrep } = await supabase
      .from('interview_negotiation_prep')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    const result = {
      ...interview,
      research: research || null,
      jd_comparisons: jdComparisons || [],
      practice_sessions: practiceSessions || [],
      session_notes: sessionNotes || null,
      thank_you_notes: thankYouNotes || [],
      followups: followups || [],
      negotiation_prep: negotiationPrep || null
    }

    console.log(`✅ Interview preparation found with all related data`)

    res.json({
      success: true,
      interview: result
    })

  } catch (error) {
    console.error('❌ Error fetching interview preparation:', error)
    res.status(500).json({
      error: 'Failed to fetch interview preparation',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews
 * Create a new interview preparation
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewData = req.body

    console.log(`📝 Creating new interview preparation for user: ${userId}`)

    // Validate required fields
    if (!interviewData.company_name || !interviewData.position_title) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'company_name and position_title are required'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('interview_preparations')
      .insert({
        user_id: userId,
        company_name: interviewData.company_name,
        position_title: interviewData.position_title,
        job_description: interviewData.job_description || null,
        jd_url: interviewData.jd_url || null,
        interview_date: interviewData.interview_date || null,
        interview_location: interviewData.interview_location || null,
        interview_type_who: interviewData.interview_type_who || null,
        interview_type_how: interviewData.interview_type_how || null,
        interview_type_when: interviewData.interview_type_when || null,
        interview_type_how_many: interviewData.interview_type_how_many || null,
        status: interviewData.status || 'preparing',
        oral_introduction: interviewData.oral_introduction || null
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Interview preparation created: ${data.id}`)

    res.json({
      success: true,
      interview: data
    })

  } catch (error) {
    console.error('❌ Error creating interview preparation:', error)
    res.status(500).json({
      error: 'Failed to create interview preparation',
      details: error.message
    })
  }
})

/**
 * PUT /api/interviews/:id
 * Update an existing interview preparation
 */
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const interviewData = req.body

    console.log(`✏️  Updating interview preparation: ${interviewId}`)

    const { data, error } = await supabase
      .from('interview_preparations')
      .update(interviewData)
      .eq('id', interviewId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    console.log(`✅ Interview preparation updated`)

    res.json({
      success: true,
      interview: data
    })

  } catch (error) {
    console.error('❌ Error updating interview preparation:', error)
    res.status(500).json({
      error: 'Failed to update interview preparation',
      details: error.message
    })
  }
})

/**
 * DELETE /api/interviews/:id
 * Delete an interview preparation (cascades to all related data)
 */
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`🗑️  Deleting interview preparation: ${interviewId}`)

    const { error } = await supabase
      .from('interview_preparations')
      .delete()
      .eq('id', interviewId)
      .eq('user_id', userId)

    if (error) throw error

    console.log(`✅ Interview preparation deleted`)

    res.json({
      success: true,
      message: 'Interview preparation deleted'
    })

  } catch (error) {
    console.error('❌ Error deleting interview preparation:', error)
    res.status(500).json({
      error: 'Failed to delete interview preparation',
      details: error.message
    })
  }
})

// ============================================
// INTERVIEW RESEARCH (Phase 1: Before)
// ============================================

/**
 * GET /api/interviews/:id/research
 * Get research for a specific interview
 */
router.get('/:id/research', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`🔍 Fetching research for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_research')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    console.log(`✅ Research ${data ? 'found' : 'not found'}`)

    res.json({
      success: true,
      research: data || null
    })

  } catch (error) {
    console.error('❌ Error fetching research:', error)
    res.status(500).json({
      error: 'Failed to fetch research',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/research
 * Create or update research for an interview
 */
router.post('/:id/research', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const researchData = req.body

    console.log(`💾 Saving research for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Check if research exists
    const { data: existing } = await supabase
      .from('interview_research')
      .select('id')
      .eq('interview_prep_id', interviewId)
      .single()

    let result
    if (existing) {
      // Update existing research
      const { data, error } = await supabase
        .from('interview_research')
        .update(researchData)
        .eq('interview_prep_id', interviewId)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Research updated`)
    } else {
      // Create new research
      const { data, error } = await supabase
        .from('interview_research')
        .insert({
          interview_prep_id: interviewId,
          ...researchData
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Research created`)
    }

    res.json({
      success: true,
      research: result
    })

  } catch (error) {
    console.error('❌ Error saving research:', error)
    res.status(500).json({
      error: 'Failed to save research',
      details: error.message
    })
  }
})

// ============================================
// JOB DESCRIPTION COMPARISON (Phase 1: Before)
// ============================================

/**
 * GET /api/interviews/:id/jd-comparisons
 * Get JD comparisons for a specific interview
 */
router.get('/:id/jd-comparisons', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`📋 Fetching JD comparisons for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('jd_comparison_analysis')
      .select(`
        *,
        par_story:par_stories(*)
      `)
      .eq('interview_prep_id', interviewId)
      .order('order_index', { ascending: true })

    if (error) throw error

    console.log(`✅ Found ${data.length} JD comparisons`)

    res.json({
      success: true,
      comparisons: data
    })

  } catch (error) {
    console.error('❌ Error fetching JD comparisons:', error)
    res.status(500).json({
      error: 'Failed to fetch JD comparisons',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/jd-comparisons
 * Create a new JD comparison
 */
router.post('/:id/jd-comparisons', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const comparisonData = req.body

    console.log(`📝 Creating JD comparison for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Validate required fields
    if (!comparisonData.responsibility) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'responsibility is required'
      })
    }

    const { data, error } = await supabase
      .from('jd_comparison_analysis')
      .insert({
        interview_prep_id: interviewId,
        ...comparisonData
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ JD comparison created`)

    res.json({
      success: true,
      comparison: data
    })

  } catch (error) {
    console.error('❌ Error creating JD comparison:', error)
    res.status(500).json({
      error: 'Failed to create JD comparison',
      details: error.message
    })
  }
})

/**
 * PUT /api/interviews/:id/jd-comparisons/:comparisonId
 * Update a JD comparison
 */
router.put('/:id/jd-comparisons/:comparisonId', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const comparisonId = req.params.comparisonId
    const comparisonData = req.body

    console.log(`✏️  Updating JD comparison: ${comparisonId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('jd_comparison_analysis')
      .update(comparisonData)
      .eq('id', comparisonId)
      .eq('interview_prep_id', interviewId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'JD comparison not found'
      })
    }

    console.log(`✅ JD comparison updated`)

    res.json({
      success: true,
      comparison: data
    })

  } catch (error) {
    console.error('❌ Error updating JD comparison:', error)
    res.status(500).json({
      error: 'Failed to update JD comparison',
      details: error.message
    })
  }
})

/**
 * DELETE /api/interviews/:id/jd-comparisons/:comparisonId
 * Delete a JD comparison
 */
router.delete('/:id/jd-comparisons/:comparisonId', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const comparisonId = req.params.comparisonId

    console.log(`🗑️  Deleting JD comparison: ${comparisonId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { error } = await supabase
      .from('jd_comparison_analysis')
      .delete()
      .eq('id', comparisonId)
      .eq('interview_prep_id', interviewId)

    if (error) throw error

    console.log(`✅ JD comparison deleted`)

    res.json({
      success: true,
      message: 'JD comparison deleted'
    })

  } catch (error) {
    console.error('❌ Error deleting JD comparison:', error)
    res.status(500).json({
      error: 'Failed to delete JD comparison',
      details: error.message
    })
  }
})

// ============================================
// INTERVIEW QUESTIONS BANK (Global Library)
// ============================================

/**
 * GET /api/interviews/questions/all
 * Get all active questions from the global question bank
 */
router.get('/questions/all', async (req, res) => {
  try {
    const { category, source, difficulty } = req.query

    console.log(`❓ Fetching interview questions${category ? ` (category: ${category})` : ''}`)

    let query = supabase
      .from('interview_questions')
      .select('*')
      .eq('is_active', true)

    if (category) {
      query = query.eq('question_category', category)
    }

    if (source) {
      query = query.eq('source', source)
    }

    if (difficulty) {
      query = query.eq('difficulty_level', difficulty)
    }

    const { data, error } = await query.order('question_category', { ascending: true })

    if (error) throw error

    console.log(`✅ Found ${data.length} questions`)

    res.json({
      success: true,
      questions: data
    })

  } catch (error) {
    console.error('❌ Error fetching questions:', error)
    res.status(500).json({
      error: 'Failed to fetch questions',
      details: error.message
    })
  }
})

/**
 * GET /api/interviews/questions/:questionId
 * Get a specific question
 */
router.get('/questions/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId

    console.log(`❓ Fetching question: ${questionId}`)

    const { data, error } = await supabase
      .from('interview_questions')
      .select('*')
      .eq('id', questionId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return res.status(404).json({
        error: 'Question not found'
      })
    }

    console.log(`✅ Question found`)

    res.json({
      success: true,
      question: data
    })

  } catch (error) {
    console.error('❌ Error fetching question:', error)
    res.status(500).json({
      error: 'Failed to fetch question',
      details: error.message
    })
  }
})

// ============================================
// MY QUESTION ANSWERS (User's Prepared Answers)
// ============================================

/**
 * GET /api/interviews/my-answers
 * Get all user's prepared answers
 */
router.get('/my-answers', async (req, res) => {
  try {
    const userId = req.user.id

    console.log(`📝 Fetching prepared answers for user: ${userId}`)

    const { data, error } = await supabase
      .from('interview_question_answers')
      .select(`
        *,
        question:interview_questions(*),
        par_story:par_stories(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    console.log(`✅ Found ${data.length} prepared answers`)

    res.json({
      success: true,
      answers: data
    })

  } catch (error) {
    console.error('❌ Error fetching prepared answers:', error)
    res.status(500).json({
      error: 'Failed to fetch prepared answers',
      details: error.message
    })
  }
})

/**
 * GET /api/interviews/my-answers/:answerId
 * Get a specific prepared answer
 */
router.get('/my-answers/:answerId', async (req, res) => {
  try {
    const userId = req.user.id
    const answerId = req.params.answerId

    console.log(`🔍 Fetching prepared answer: ${answerId}`)

    const { data, error } = await supabase
      .from('interview_question_answers')
      .select(`
        *,
        question:interview_questions(*),
        par_story:par_stories(*)
      `)
      .eq('id', answerId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return res.status(404).json({
        error: 'Prepared answer not found'
      })
    }

    console.log(`✅ Prepared answer found`)

    res.json({
      success: true,
      answer: data
    })

  } catch (error) {
    console.error('❌ Error fetching prepared answer:', error)
    res.status(500).json({
      error: 'Failed to fetch prepared answer',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/generate-answers
 * Generate AI answers for interview questions based on user's resume
 */
router.post('/generate-answers', async (req, res) => {
  try {
    const userId = req.user.id
    console.log(`🤖 Generating interview answers for user: ${userId}`)

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

    // 3. Generate answers using OpenAI
    const prompt = `You are an expert Interview Coach. Generate a personalized, first-person interview answer for the following candidate.

CANDIDATE PROFILE:
${contextText}

INSTRUCTIONS:
- Write in the first person ("I").
- Use the STAR/PAR method (Problem, Action, Result) implicitly.
- Be professional, confident, and specific.
- Reference the candidate's actual experience from the profile provided.
- Keep answers concise (approx 100-150 words).

QUESTIONS TO ANSWER:
${questionsToAnswer.map((q, i) => `${i + 1}. ${q.question_text}`).join('\n')}

OUTPUT FORMAT:
Return a valid JSON array of objects, each with "question_index" (1-based) and "answer_text".
Example: [{"question_index": 1, "answer_text": "I believe..."}]`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful AI interview coach." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    })

    const responseContent = completion.choices[0].message.content
    const parsedResponse = JSON.parse(responseContent)
    const answersArray = parsedResponse.answers || parsedResponse // Handle both {answers: [...]} and [...] formats if API varies

    // 4. Save answers to database
    let savedCount = 0
    let lastGeneratedAnswer = null

    if (Array.isArray(answersArray)) {
      for (const item of answersArray) {
        const qIndex = item.question_index - 1
        if (questionsToAnswer[qIndex]) {
          const question = questionsToAnswer[qIndex]

          const { data: savedAnswer } = await supabaseAdmin
            .from('interview_question_answers')
            .upsert({
              user_id: userId,
              question_id: question.id,
              answer_text: item.answer_text,
              confidence_level: 3,
              needs_improvement: true,
              improvement_notes: 'Generated by AI based on your profile. Review and personalize.'
            }, { onConflict: 'user_id, question_id' })
            .select()
            .single()

          lastGeneratedAnswer = savedAnswer
          savedCount++
        }
      }
    }

    console.log(`✅ Successfully generated and saved ${savedCount} answers`)

    res.json({
      success: true,
      generatedCount: savedCount,
      message: `Generated ${savedCount} new personalized answers`,
      answer: lastGeneratedAnswer // Return the answer if called for a single question
    })

  } catch (error) {
    console.error('❌ Error generating interview answers:', error)
    res.status(500).json({
      error: 'Failed to generate answers',
      details: error.message
    })
  }
})
/**
 * GET /api/interviews/my-answers/:answerId
 * Get a specific prepared answer
 */
router.get('/my-answers/:answerId', async (req, res) => {
  try {
    const userId = req.user.id
    const answerId = req.params.answerId

    console.log(`🔍 Fetching prepared answer: ${answerId}`)

    const { data, error } = await supabase
      .from('interview_question_answers')
      .select(`
        *,
        question:interview_questions(*),
        par_story:par_stories(*)
      `)
      .eq('id', answerId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    if (!data) {
      return res.status(404).json({
        error: 'Prepared answer not found'
      })
    }

    console.log(`✅ Prepared answer found`)

    res.json({
      success: true,
      answer: data
    })

  } catch (error) {
    console.error('❌ Error fetching prepared answer:', error)
    res.status(500).json({
      error: 'Failed to fetch prepared answer',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/my-answers
 * Create a new prepared answer
 */
router.post('/my-answers', async (req, res) => {
  try {
    const userId = req.user.id
    const answerData = req.body

    console.log(`📝 Creating prepared answer for user: ${userId}`)

    // Validate required fields
    if (!answerData.question_id || !answerData.answer_text) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'question_id and answer_text are required'
      })
    }

    const { data, error } = await supabase
      .from('interview_question_answers')
      .insert({
        user_id: userId,
        question_id: answerData.question_id,
        answer_text: answerData.answer_text,
        par_story_id: answerData.par_story_id || null,
        confidence_level: answerData.confidence_level || 3,
        needs_improvement: answerData.needs_improvement !== undefined ? answerData.needs_improvement : true,
        improvement_notes: answerData.improvement_notes || null
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Prepared answer created`)

    res.json({
      success: true,
      answer: data
    })

  } catch (error) {
    console.error('❌ Error creating prepared answer:', error)
    res.status(500).json({
      error: 'Failed to create prepared answer',
      details: error.message
    })
  }
})

/**
 * PUT /api/interviews/my-answers/:answerId
 * Update a prepared answer
 */
router.put('/my-answers/:answerId', async (req, res) => {
  try {
    const userId = req.user.id
    const answerId = req.params.answerId
    const answerData = req.body

    console.log(`✏️  Updating prepared answer: ${answerId}`)

    const { data, error } = await supabase
      .from('interview_question_answers')
      .update(answerData)
      .eq('id', answerId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'Prepared answer not found'
      })
    }

    console.log(`✅ Prepared answer updated`)

    res.json({
      success: true,
      answer: data
    })

  } catch (error) {
    console.error('❌ Error updating prepared answer:', error)
    res.status(500).json({
      error: 'Failed to update prepared answer',
      details: error.message
    })
  }
})

/**
 * DELETE /api/interviews/my-answers/:answerId
 * Delete a prepared answer
 */
router.delete('/my-answers/:answerId', async (req, res) => {
  try {
    const userId = req.user.id
    const answerId = req.params.answerId

    console.log(`🗑️  Deleting prepared answer: ${answerId}`)

    const { error } = await supabase
      .from('interview_question_answers')
      .delete()
      .eq('id', answerId)
      .eq('user_id', userId)

    if (error) throw error

    console.log(`✅ Prepared answer deleted`)

    res.json({
      success: true,
      message: 'Prepared answer deleted'
    })

  } catch (error) {
    console.error('❌ Error deleting prepared answer:', error)
    res.status(500).json({
      error: 'Failed to delete prepared answer',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/my-answers/:answerId/practice
 * Record that user practiced this answer
 */
router.post('/my-answers/:answerId/practice', async (req, res) => {
  try {
    const userId = req.user.id
    const answerId = req.params.answerId

    console.log(`🎯 Recording practice for answer: ${answerId}`)

    // Get current answer
    const { data: current, error: fetchError } = await supabase
      .from('interview_question_answers')
      .select('times_practiced')
      .eq('id', answerId)
      .eq('user_id', userId)
      .single()

    if (fetchError) throw fetchError

    if (!current) {
      return res.status(404).json({
        error: 'Prepared answer not found'
      })
    }

    // Increment practice count
    const { data, error } = await supabase
      .from('interview_question_answers')
      .update({
        times_practiced: (current.times_practiced || 0) + 1,
        last_practiced_date: new Date().toISOString()
      })
      .eq('id', answerId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Practice recorded (${data.times_practiced} times)`)

    res.json({
      success: true,
      answer: data
    })

  } catch (error) {
    console.error('❌ Error recording practice:', error)
    res.status(500).json({
      error: 'Failed to record practice',
      details: error.message
    })
  }
})

// ============================================
// PRACTICE SESSIONS (Phase 1: Before)
// ============================================

/**
 * GET /api/interviews/:id/practice-sessions
 * Get practice sessions for a specific interview
 */
router.get('/:id/practice-sessions', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`🎯 Fetching practice sessions for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_practice_sessions')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('practice_date', { ascending: false })

    if (error) throw error

    console.log(`✅ Found ${data.length} practice sessions`)

    res.json({
      success: true,
      sessions: data
    })

  } catch (error) {
    console.error('❌ Error fetching practice sessions:', error)
    res.status(500).json({
      error: 'Failed to fetch practice sessions',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/practice-sessions
 * Create a new practice session
 */
router.post('/:id/practice-sessions', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const sessionData = req.body

    console.log(`📝 Creating practice session for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Validate required fields
    if (!sessionData.practice_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'practice_date is required'
      })
    }

    const { data, error } = await supabase
      .from('interview_practice_sessions')
      .insert({
        interview_prep_id: interviewId,
        ...sessionData
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Practice session created`)

    res.json({
      success: true,
      session: data
    })

  } catch (error) {
    console.error('❌ Error creating practice session:', error)
    res.status(500).json({
      error: 'Failed to create practice session',
      details: error.message
    })
  }
})

// ============================================
// INTERVIEW SESSION NOTES (Phase 2: During)
// ============================================

/**
 * GET /api/interviews/:id/session-notes
 * Get session notes for a specific interview
 */
router.get('/:id/session-notes', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`📋 Fetching session notes for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_session_notes')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    console.log(`✅ Session notes ${data ? 'found' : 'not found'}`)

    res.json({
      success: true,
      notes: data || null
    })

  } catch (error) {
    console.error('❌ Error fetching session notes:', error)
    res.status(500).json({
      error: 'Failed to fetch session notes',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/session-notes
 * Create or update session notes for an interview
 */
router.post('/:id/session-notes', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const notesData = req.body

    console.log(`💾 Saving session notes for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Check if notes exist
    const { data: existing } = await supabase
      .from('interview_session_notes')
      .select('id')
      .eq('interview_prep_id', interviewId)
      .single()

    let result
    if (existing) {
      // Update existing notes
      const { data, error } = await supabase
        .from('interview_session_notes')
        .update(notesData)
        .eq('interview_prep_id', interviewId)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Session notes updated`)
    } else {
      // Create new notes
      const { data, error } = await supabase
        .from('interview_session_notes')
        .insert({
          interview_prep_id: interviewId,
          ...notesData
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Session notes created`)
    }

    res.json({
      success: true,
      notes: result
    })

  } catch (error) {
    console.error('❌ Error saving session notes:', error)
    res.status(500).json({
      error: 'Failed to save session notes',
      details: error.message
    })
  }
})

// ============================================
// THANK YOU NOTES (Phase 3: After)
// ============================================

/**
 * GET /api/interviews/:id/thank-you-notes
 * Get thank you notes for a specific interview
 */
router.get('/:id/thank-you-notes', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`✉️  Fetching thank you notes for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('thank_you_notes')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`✅ Found ${data.length} thank you notes`)

    res.json({
      success: true,
      thankYouNotes: data
    })

  } catch (error) {
    console.error('❌ Error fetching thank you notes:', error)
    res.status(500).json({
      error: 'Failed to fetch thank you notes',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/thank-you-notes
 * Create a new thank you note
 */
router.post('/:id/thank-you-notes', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const noteData = req.body

    console.log(`📝 Creating thank you note for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Validate required fields
    if (!noteData.recipient_name || !noteData.recipient_email || !noteData.note_body) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'recipient_name, recipient_email, and note_body are required'
      })
    }

    const { data, error } = await supabase
      .from('thank_you_notes')
      .insert({
        interview_prep_id: interviewId,
        ...noteData
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Thank you note created`)

    res.json({
      success: true,
      thankYouNote: data
    })

  } catch (error) {
    console.error('❌ Error creating thank you note:', error)
    res.status(500).json({
      error: 'Failed to create thank you note',
      details: error.message
    })
  }
})

/**
 * PUT /api/interviews/:id/thank-you-notes/:noteId
 * Update a thank you note
 */
router.put('/:id/thank-you-notes/:noteId', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const noteId = req.params.noteId
    const noteData = req.body

    console.log(`✏️  Updating thank you note: ${noteId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('thank_you_notes')
      .update(noteData)
      .eq('id', noteId)
      .eq('interview_prep_id', interviewId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'Thank you note not found'
      })
    }

    console.log(`✅ Thank you note updated`)

    res.json({
      success: true,
      thankYouNote: data
    })

  } catch (error) {
    console.error('❌ Error updating thank you note:', error)
    res.status(500).json({
      error: 'Failed to update thank you note',
      details: error.message
    })
  }
})

// ============================================
// FOLLOW-UPS (Phase 3: After)
// ============================================

/**
 * GET /api/interviews/:id/followups
 * Get follow-ups for a specific interview
 */
router.get('/:id/followups', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`📅 Fetching follow-ups for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_followups')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .order('followup_date', { ascending: true })

    if (error) throw error

    console.log(`✅ Found ${data.length} follow-ups`)

    res.json({
      success: true,
      followups: data
    })

  } catch (error) {
    console.error('❌ Error fetching follow-ups:', error)
    res.status(500).json({
      error: 'Failed to fetch follow-ups',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/followups
 * Create a new follow-up
 */
router.post('/:id/followups', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const followupData = req.body

    console.log(`📝 Creating follow-up for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Validate required fields
    if (!followupData.followup_type || !followupData.followup_date) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'followup_type and followup_date are required'
      })
    }

    const { data, error } = await supabase
      .from('interview_followups')
      .insert({
        interview_prep_id: interviewId,
        ...followupData
      })
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Follow-up created`)

    res.json({
      success: true,
      followup: data
    })

  } catch (error) {
    console.error('❌ Error creating follow-up:', error)
    res.status(500).json({
      error: 'Failed to create follow-up',
      details: error.message
    })
  }
})

/**
 * PUT /api/interviews/:id/followups/:followupId
 * Update a follow-up
 */
router.put('/:id/followups/:followupId', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const followupId = req.params.followupId
    const followupData = req.body

    console.log(`✏️  Updating follow-up: ${followupId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_followups')
      .update(followupData)
      .eq('id', followupId)
      .eq('interview_prep_id', interviewId)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return res.status(404).json({
        error: 'Follow-up not found'
      })
    }

    console.log(`✅ Follow-up updated`)

    res.json({
      success: true,
      followup: data
    })

  } catch (error) {
    console.error('❌ Error updating follow-up:', error)
    res.status(500).json({
      error: 'Failed to update follow-up',
      details: error.message
    })
  }
})

// ============================================
// NEGOTIATION PREP (Phase 3: After)
// ============================================

/**
 * GET /api/interviews/:id/negotiation-prep
 * Get negotiation prep for a specific interview
 */
router.get('/:id/negotiation-prep', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id

    console.log(`💰 Fetching negotiation prep for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    const { data, error } = await supabase
      .from('interview_negotiation_prep')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .single()

    if (error && error.code !== 'PGRST116') throw error

    console.log(`✅ Negotiation prep ${data ? 'found' : 'not found'}`)

    res.json({
      success: true,
      negotiationPrep: data || null
    })

  } catch (error) {
    console.error('❌ Error fetching negotiation prep:', error)
    res.status(500).json({
      error: 'Failed to fetch negotiation prep',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/negotiation-prep
 * Create or update negotiation prep for an interview
 */
router.post('/:id/negotiation-prep', async (req, res) => {
  try {
    const userId = req.user.id
    const interviewId = req.params.id
    const negotiationData = req.body

    console.log(`💾 Saving negotiation prep for interview: ${interviewId}`)

    // Verify ownership
    const { data: interview } = await supabase
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .single()

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found'
      })
    }

    // Check if negotiation prep exists
    const { data: existing } = await supabase
      .from('interview_negotiation_prep')
      .select('id')
      .eq('interview_prep_id', interviewId)
      .single()

    let result
    if (existing) {
      // Update existing negotiation prep
      const { data, error } = await supabase
        .from('interview_negotiation_prep')
        .update(negotiationData)
        .eq('interview_prep_id', interviewId)
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Negotiation prep updated`)
    } else {
      // Create new negotiation prep
      const { data, error } = await supabase
        .from('interview_negotiation_prep')
        .insert({
          interview_prep_id: interviewId,
          ...negotiationData
        })
        .select()
        .single()

      if (error) throw error
      result = data
      console.log(`✅ Negotiation prep created`)
    }

    res.json({
      success: true,
      negotiationPrep: result
    })

  } catch (error) {
    console.error('❌ Error saving negotiation prep:', error)
    res.status(500).json({
      error: 'Failed to save negotiation prep',
      details: error.message
    })
  }
})

// ============================================
// AI MOCK INTERVIEW (Practice with AI)
// ============================================

/**
 * POST /api/interviews/:id/ai-practice
 * AI Mock Interview conversation endpoint
 * Body: { messages: [{ role, content }], userResponse?: string }
 */
router.post('/:id/ai-practice', async (req, res) => {
  try {
    const { id: interviewId } = req.params
    const userId = req.user.id
    const { messages, userResponse } = req.body

    console.log(`🤖 AI Mock Interview request for interview: ${interviewId}`)

    // Load interview and research data
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interview_preparations')
      .select('*')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .maybeSingle()

    if (interviewError) throw interviewError

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found or you do not have access to it'
      })
    }

    // Get user profile for personalization
    const { data: userData } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', userId)
      .maybeSingle()

    const candidateName = userData?.first_name || 'there'

    // Load research data for context
    const { data: research } = await supabaseAdmin
      .from('interview_research')
      .select('*')
      .eq('interview_prep_id', interviewId)
      .maybeSingle()

    // Load PAR stories and JD comparison analysis
    const { data: jdAnalysis } = await supabaseAdmin
      .from('jd_comparison_analysis')
      .select(`
        *,
        par_story:par_stories(
          id,
          role_company,
          year,
          problem_challenge,
          actions,
          result
        )
      `)
      .eq('interview_prep_id', interviewId)
      .order('order_index', { ascending: true })

    // Format PAR stories for the prompt
    let parStoriesContext = ''
    if (jdAnalysis && jdAnalysis.length > 0) {
      parStoriesContext = '\n\nCANDIDATE\'S EXPERIENCE (PAR Stories):\n'
      jdAnalysis.forEach((analysis, idx) => {
        if (analysis.par_story) {
          const story = analysis.par_story
          parStoriesContext += `\n${idx + 1}. ${story.role_company} (${story.year || 'N/A'}):
   Problem: ${story.problem_challenge}
   Actions: ${typeof story.actions === 'object' ? JSON.stringify(story.actions) : story.actions}
   Result: ${story.result}\n`
        }
      })
    }

    // Format interviewer context if available
    let interviewerContext = ''
    if (research) {
      if (research.interviewer_name) {
        interviewerContext += `\n\nABOUT YOU (THE INTERVIEWER):\n- Your name: ${research.interviewer_name}`
        if (research.interviewer_role) interviewerContext += `\n- Your role: ${research.interviewer_role}`
        if (research.interviewer_notes) interviewerContext += `\n- Background: ${research.interviewer_notes}`
        if (research.common_connections) interviewerContext += `\n- Mutual connections: ${research.common_connections}`
      }
    }

    // Build system prompt with interview context
    const systemPrompt = `You are ${research?.interviewer_name || 'Jon'}, ${research?.interviewer_role ? `a ${research.interviewer_role}` : 'an interviewer'} at ${interview.company_name || 'the company'}.

You're conducting a friendly, conversational mock interview with ${candidateName} for the ${interview.position_title || 'position'}.

INTERVIEW CONTEXT:
- Position: ${interview.position_title || 'Not specified'}
- Company: ${interview.company_name || 'Not specified'}
${research?.company_news ? `- Recent Company News: ${research.company_news.substring(0, 200)}...` : ''}
${research?.company_culture ? `- Company Culture: ${research.company_culture.substring(0, 200)}...` : ''}
${research?.industry_trends ? `- Industry Trends: ${research.industry_trends.substring(0, 200)}...` : ''}
${interviewerContext}
${parStoriesContext}

YOUR CONVERSATION STYLE:
- Be warm and friendly, like talking with a colleague over coffee
- Keep responses VERY SHORT (1-2 sentences max)
- Ask ONE question at a time
- Use natural language: "Great!", "Nice!", "Tell me more", "I see", "Interesting!"
- React to their answers naturally, don't follow a rigid script
- If they ask about you or the company, answer briefly using the info above

BREAKING THE ICE:
Start with a casual introduction: "Hi ${candidateName}! This is ${research?.interviewer_name || 'Jon'}. Great to meet you! Before we dive in, tell me a bit about yourself as a person - who are you, where are you coming from?"

DURING THE INTERVIEW:
- Ask about their CAR/PAR stories (you have them above for reference)
- Ask behavioral questions naturally: "Tell me about a time when..."
- Follow up on interesting points they mention
- Reference their specific experiences from the PAR stories
- Keep it conversational, not interrogative
- Give brief encouragement: "That's helpful", "Good example"

IF THEY ASK ABOUT YOU:
- Use the interviewer info above to answer
- Keep it brief and redirect to them: "I've been here 3 years and love it! But tell me more about your experience with..."

ENDING THE INTERVIEW (after 6-8 exchanges):
Keep it casual: "This has been great ${candidateName}! You shared some solid examples. Quick thoughts: [1-2 strengths]. One thing to work on: [1 area]. You're going to do great in your interviews!"

CRITICAL RULES:
- MAX 2 SENTENCES per response
- ONE question at a time only
- Natural conversation, not formal interview speak
- Don't list things or use bullets mid-interview
- React to what they actually say`

    // Build messages array for OpenAI
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...(messages || [])
    ]

    // Add user response if provided
    if (userResponse) {
      chatMessages.push({ role: 'user', content: userResponse })
    }

    console.log(`🤖 Calling OpenAI with ${chatMessages.length} messages`)

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 800
    })

    const aiResponse = completion.choices[0].message.content

    console.log(`✅ AI response generated (${aiResponse.length} chars)`)

    res.json({
      success: true,
      response: aiResponse,
      usage: completion.usage
    })

  } catch (error) {
    console.error('❌ Error in AI mock interview:', error)
    res.status(500).json({
      error: 'Failed to process AI interview',
      details: error.message
    })
  }
})

/**
 * POST /api/interviews/:id/text-to-speech
 * Generate audio from text using OpenAI TTS
 * Body: { text: string, voice?: string }
 */
router.post('/:id/text-to-speech', async (req, res) => {
  try {
    const { id: interviewId } = req.params
    const userId = req.user.id
    const { text, voice = 'nova' } = req.body

    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    console.log(`🔊 TTS request for interview: ${interviewId}, text length: ${text.length}`)

    // Verify user has access to this interview
    const { data: interview, error: interviewError } = await supabaseAdmin
      .from('interview_preparations')
      .select('id')
      .eq('id', interviewId)
      .eq('user_id', userId)
      .maybeSingle()

    if (interviewError) throw interviewError

    if (!interview) {
      return res.status(404).json({
        error: 'Interview preparation not found or you do not have access to it'
      })
    }

    // Call OpenAI TTS API
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice, // options: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0
    })

    // Convert response to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    console.log(`✅ TTS audio generated: ${buffer.length} bytes`)

    // Send audio back as MP3
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'no-cache'
    })
    res.send(buffer)

  } catch (error) {
    console.error('❌ Error generating TTS audio:', error)
    res.status(500).json({
      error: 'Failed to generate audio',
      details: error.message
    })
  }
})

export default router
