/**
 * Smart Matches API
 *
 * Curated company match briefs for the authenticated user.
 * Gated to a single pilot user by email. All vendor-specific
 * vocabulary is stripped at the service boundary via
 * smartMatchTranslator before anything reaches this layer or
 * the database.
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabase.js'
import { matchCandidate } from '../services/frictionradar.js'
import { translateMatchResult } from '../services/smartMatchTranslator.js'
import { openai } from '../services/openai.js'
import { generateTailoredCv } from '../services/cvPersonalization.js'

const router = express.Router()

const PILOT_EMAIL = 'efrain.pradas@gmail.com'

router.use(requireAuth)

function requirePilotUser(req, res, next) {
  if (req.user?.email !== PILOT_EMAIL) {
    return res.status(403).json({ error: 'Not available for this account' })
  }
  next()
}

/**
 * Resolves the user's preferred language for CV generation:
 *   1. req.body.language (sent by frontend i18n) → 2. user_profiles.preferred_language
 *   → 3. users.preferred_language → 4. 'en'.
 * Same cascade used by backend/routes/positioningQuestionnaire.js.
 */
async function resolveUserLanguage(req, userId) {
  let langCode = req.body?.language
  if (!langCode) {
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('preferred_language')
      .eq('user_id', userId)
      .maybeSingle()
    langCode = userProfile?.preferred_language
  }
  if (!langCode) {
    const { data: userRecord } = await supabaseAdmin
      .from('users')
      .select('preferred_language')
      .eq('id', userId)
      .maybeSingle()
    langCode = userRecord?.preferred_language
  }
  return (langCode || 'en').toString().slice(0, 2).toLowerCase()
}

async function buildCandidatePayload(userId) {
  const { data: masterResumes } = await supabaseAdmin
    .from('user_resumes')
    .select('id, profile_summary, updated_at')
    .eq('user_id', userId)
    .eq('is_master', true)
    .order('updated_at', { ascending: false })
    .limit(1)

  const masterResume = masterResumes?.[0]
  if (!masterResume) return null

  const [{ data: stories }, { data: bullets }, { data: questionnaire }] = await Promise.all([
    supabaseAdmin
      .from('par_stories')
      .select('title, problem_challenge, actions, result, competencies, skills_tags')
      .eq('user_id', userId)
      .limit(12),
    supabaseAdmin
      .from('accomplishment_bank')
      .select('bullet_text')
      .eq('user_id', userId)
      .limit(40),
    supabaseAdmin
      .from('positioning_questionnaire')
      .select('identity_target_title, industries, functions')
      .eq('user_id', userId)
      .maybeSingle()
      .then((r) => ({ data: r.data })),
  ])

  const profile_summary = (masterResume.profile_summary || '').trim()
  const bulletList = (bullets || [])
    .map((b) => (b.bullet_text || '').trim())
    .filter(Boolean)

  const parStoryList = (stories || []).map((s) => ({
    title: s.title || null,
    problem: s.problem_challenge || null,
    actions: Array.isArray(s.actions)
      ? s.actions
      : s.actions
        ? [s.actions]
        : [],
    result: s.result || null,
    competencies: s.competencies || [],
    skills: s.skills_tags || [],
  }))

  const target_function = questionnaire?.data?.identity_target_title || null
  const target_sectors = Array.isArray(questionnaire?.data?.industries)
    ? questionnaire.data.industries
    : []

  if (!profile_summary && bulletList.length === 0 && parStoryList.length === 0) {
    return null
  }

  return {
    profile_summary,
    bullets: bulletList,
    par_stories: parStoryList,
    target_function,
    target_sectors,
    top_k: 10,
  }
}

/**
 * POST /api/smart-matches/refresh
 * Requests a fresh set of curated matches from the intelligence service,
 * translates them to neutral vocabulary, and upserts them.
 */
router.post('/refresh', requirePilotUser, async (req, res) => {
  try {
    const userId = req.user.id

    const payload = await buildCandidatePayload(userId)
    if (!payload) {
      return res.status(400).json({
        error: 'Upload your resume first',
        details:
          'A master resume with profile summary, PAR stories, or accomplishments is required before requesting matches.',
      })
    }

    let rawResults
    try {
      rawResults = await matchCandidate(payload)
    } catch (err) {
      const status = err?.status || err?.response?.status || 502
      console.error('[smart-matches] matchCandidate failed:', err?.message)
      return res.status(status).json({
        error: 'Match service unavailable',
        details: err?.message || 'Upstream request failed',
      })
    }

    const list = Array.isArray(rawResults?.results)
      ? rawResults.results
      : Array.isArray(rawResults)
        ? rawResults
        : []

    const translated = list.map(translateMatchResult).filter(Boolean)

    const rows = translated
      .filter((b) => b.company_id && b.domain)
      .map((b) => ({
        user_id: userId,
        company_id: b.company_id,
        domain: b.domain,
        match_score: b.match_score ?? 0,
        match_rationale: b.match_rationale,
        snapshot_neutral: b.snapshot_neutral || {},
        status: 'proposed',
      }))

    if (rows.length > 0) {
      const { error: upsertError } = await supabaseAdmin
        .from('smart_match_briefs')
        .upsert(rows, { onConflict: 'user_id,company_id' })

      if (upsertError) {
        console.error('[smart-matches] upsert failed:', upsertError)
        return res.status(500).json({
          error: 'Failed to save matches',
          details: upsertError.message,
        })
      }
    }

    const { data: briefs, error: selectError } = await supabaseAdmin
      .from('smart_match_briefs')
      .select('*')
      .eq('user_id', userId)
      .order('match_score', { ascending: false })

    if (selectError) throw selectError

    return res.json({ count: briefs?.length || 0, briefs: briefs || [] })
  } catch (error) {
    console.error('[smart-matches] refresh error:', error)
    return res.status(500).json({
      error: 'Failed to refresh matches',
      details: error.message,
    })
  }
})

/**
 * GET /api/smart-matches?status=proposed
 * Lists curated matches for the authenticated pilot user.
 */
router.get('/', requirePilotUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    let query = supabaseAdmin
      .from('smart_match_briefs')
      .select('*')
      .eq('user_id', userId)
      .order('match_score', { ascending: false })

    if (status && ['proposed', 'saved', 'dismissed'].includes(String(status))) {
      query = query.eq('status', status)
    }

    const { data, error } = await query
    if (error) throw error

    return res.json({ count: data?.length || 0, briefs: data || [] })
  } catch (error) {
    console.error('[smart-matches] list error:', error)
    return res.status(500).json({
      error: 'Failed to list matches',
      details: error.message,
    })
  }
})

/**
 * PATCH /api/smart-matches/:id
 * Updates the status of a single match brief. When the new status is
 * 'saved', also (re)uses an existing tailored CV version, or generates
 * one synchronously. Generation failures do not block the save.
 */
router.patch('/:id', requirePilotUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { status } = req.body || {}

    if (!['saved', 'dismissed', 'proposed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const { data, error } = await supabaseAdmin
      .from('smart_match_briefs')
      .update({ status })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Match not found' })
      }
      throw error
    }

    if (status !== 'saved') {
      return res.json({ brief: data })
    }

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('smart_match_cv_versions')
      .select('*')
      .eq('brief_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingError) {
      console.error('[smart-matches] existing cv lookup failed:', existingError)
    }

    let cvVersion = existing || null
    let cvError = null

    if (!cvVersion) {
      try {
        const language = await resolveUserLanguage(req, userId)
        cvVersion = await generateTailoredCv({
          userId,
          briefId: id,
          supabase: supabaseAdmin,
          openai,
          language,
        })
      } catch (err) {
        console.error('[smart-matches] cv generation failed:', err?.code || err?.message)
        cvError = { code: err?.code || 'GENERATION_FAILED', message: err?.message || 'Generation failed' }
      }
    }

    return res.json({ brief: data, cv_version: cvVersion, cv_error: cvError })
  } catch (error) {
    console.error('[smart-matches] patch error:', error)
    return res.status(500).json({
      error: 'Failed to update match',
      details: error.message,
    })
  }
})

/**
 * GET /api/smart-matches/:id/cv
 * Returns the tailored CV version associated with a brief, if any.
 */
router.get('/:id/cv', requirePilotUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('smart_match_cv_versions')
      .select('*')
      .eq('brief_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return res.json({ cv_version: data || null })
  } catch (error) {
    console.error('[smart-matches] get cv error:', error)
    return res.status(500).json({
      error: 'Failed to load tailored CV',
      details: error.message,
    })
  }
})

/**
 * POST /api/smart-matches/:id/regenerate-cv
 * Deletes any existing tailored CV for the brief and generates a new one.
 */
router.post('/:id/regenerate-cv', requirePilotUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { id } = req.params

    const { error: deleteError } = await supabaseAdmin
      .from('smart_match_cv_versions')
      .delete()
      .eq('brief_id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[smart-matches] delete existing cv failed:', deleteError)
    }

    try {
      const language = await resolveUserLanguage(req, userId)
      const cvVersion = await generateTailoredCv({
        userId,
        briefId: id,
        supabase: supabaseAdmin,
        openai,
        language,
      })
      return res.json({ cv_version: cvVersion })
    } catch (err) {
      const status = err?.status || (err?.code === 'NO_MASTER_RESUME' ? 400 : err?.code === 'BRIEF_NOT_FOUND' ? 404 : 500)
      console.error('[smart-matches] regenerate cv failed:', err?.code || err?.message)
      return res.status(status).json({
        error: 'Failed to regenerate tailored CV',
        code: err?.code || 'GENERATION_FAILED',
        details: err?.message,
      })
    }
  } catch (error) {
    console.error('[smart-matches] regenerate cv error:', error)
    return res.status(500).json({
      error: 'Failed to regenerate tailored CV',
      details: error.message,
    })
  }
})

export default router
