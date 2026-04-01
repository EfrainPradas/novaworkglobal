/**
 * Smart Guided Path — API Routes
 *
 * All endpoints for the guided path system.
 * Follows existing project patterns: Express + requireAuth + supabaseAdmin.
 */

import express from 'express'
import { requireAuth } from '../middleware/auth.js'
import { supabaseAdmin } from '../services/supabase.js'
import { resolveNextStep, syncStepStates } from '../services/guidedPath/routingEngine.js'
import { evaluateCompletionRule } from '../services/guidedPath/completionEngine.js'

const router = express.Router()

// All routes require authentication
router.use(requireAuth)

// ============================================================================
// PATH LIFECYCLE
// ============================================================================

/**
 * POST /api/guided-path/enable
 * Enable guided mode and initialize a path run.
 */
router.post('/enable', async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabaseAdmin.rpc('initialize_guided_path', {
      p_user_id: userId
    })

    if (error) return res.status(500).json({ error: error.message })

    // Log event
    await logEvent(userId, 'guided_mode_enabled', {
      run_id: data.run_id,
      session_id: req.body.session_id,
    })

    res.json({ success: true, data })
  } catch (err) {
    console.error('[guidedPath] /enable error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/disable
 * Disable guided mode without losing progress.
 */
router.post('/disable', async (req, res) => {
  try {
    const userId = req.user.id
    const run = await getActiveRun(userId)

    if (run) {
      await supabaseAdmin
        .from('guided_path_runs')
        .update({ guidance_enabled: false })
        .eq('id', run.id)

      await logEvent(userId, 'guided_mode_disabled', {
        run_id: run.id,
        session_id: req.body.session_id,
      })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /disable error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/pause
 * Pause the guided path.
 */
router.post('/pause', async (req, res) => {
  try {
    const userId = req.user.id
    const run = await getActiveRun(userId)

    if (!run) return res.status(404).json({ error: 'No active guided path' })

    await supabaseAdmin
      .from('guided_path_runs')
      .update({
        status: 'paused',
        paused_at: new Date().toISOString(),
      })
      .eq('id', run.id)

    await logEvent(userId, 'guided_path_paused', {
      run_id: run.id,
      session_id: req.body.session_id,
      step_key: run.current_actual_step_key,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /pause error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/resume
 * Resume a paused guided path.
 */
router.post('/resume', async (req, res) => {
  try {
    const userId = req.user.id

    const { data: run } = await supabaseAdmin
      .from('guided_path_runs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'paused')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!run) return res.status(404).json({ error: 'No paused guided path' })

    await supabaseAdmin
      .from('guided_path_runs')
      .update({
        status: 'in_progress',
        resumed_at: new Date().toISOString(),
        guidance_enabled: true,
      })
      .eq('id', run.id)

    // Re-sync to get current recommendation
    const recommendation = await syncStepStates(supabaseAdmin, userId, run.id)

    await logEvent(userId, 'guided_path_resumed', {
      run_id: run.id,
      session_id: req.body.session_id,
      step_key: recommendation.next_step_key,
    })

    res.json({ success: true, data: recommendation })
  } catch (err) {
    console.error('[guidedPath] /resume error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// STATE & NAVIGATION
// ============================================================================

/**
 * GET /api/guided-path/state
 * Get the full guided path state for the current user.
 */
router.get('/state', async (req, res) => {
  try {
    const userId = req.user.id

    const { data, error } = await supabaseAdmin.rpc('get_guided_path_state', {
      p_user_id: userId
    })

    if (error) return res.status(500).json({ error: error.message })

    res.json({ success: true, data })
  } catch (err) {
    console.error('[guidedPath] /state error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/guided-path/next-step
 * Get the next recommended step based on actual data completion.
 */
router.get('/next-step', async (req, res) => {
  try {
    const userId = req.user.id
    const run = await getActiveRun(userId)

    if (!run) {
      return res.json({
        success: true,
        data: { has_active_run: false, next_step_key: null }
      })
    }

    const recommendation = await resolveNextStep(supabaseAdmin, userId, run.id)

    res.json({ success: true, data: { has_active_run: true, ...recommendation } })
  } catch (err) {
    console.error('[guidedPath] /next-step error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/select-input-method
 * Set the input method branching decision.
 */
router.post('/select-input-method', async (req, res) => {
  try {
    const userId = req.user.id
    const { input_method } = req.body

    if (!['resume_import', 'manual_experience_entry'].includes(input_method)) {
      return res.status(400).json({ error: 'Invalid input_method' })
    }

    const run = await getActiveRun(userId)
    if (!run) return res.status(404).json({ error: 'No active guided path' })

    await supabaseAdmin
      .from('guided_path_runs')
      .update({ input_method })
      .eq('id', run.id)

    await logEvent(userId, 'input_method_selected', {
      run_id: run.id,
      session_id: req.body.session_id,
      step_key: 'resume_experience_capture',
      input_method,
    })

    await logEvent(userId, 'branching_decision', {
      run_id: run.id,
      session_id: req.body.session_id,
      step_key: 'resume_experience_capture',
      metadata: { branch_chosen: input_method },
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /select-input-method error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// STEP OPERATIONS
// ============================================================================

/**
 * POST /api/guided-path/step/view
 * Record that a user viewed a step.
 */
router.post('/step/view', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, session_id, source_page } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.json({ success: true, skipped: true })

    const stepState = await getStepState(run.id, step_key)
    if (!stepState) return res.json({ success: true, skipped: true })

    // Update view count and first_viewed_at
    const updates = {
      view_count: (stepState.view_count || 0) + 1,
    }
    if (!stepState.first_viewed_at) {
      updates.first_viewed_at = new Date().toISOString()
    }
    if (stepState.status === 'available' || stepState.status === 'not_started') {
      updates.status = 'in_progress'
      updates.started_at = new Date().toISOString()
    }

    await supabaseAdmin
      .from('guided_step_states')
      .update(updates)
      .eq('id', stepState.id)

    // Update run's current actual step
    await supabaseAdmin
      .from('guided_path_runs')
      .update({ current_actual_step_key: step_key })
      .eq('id', run.id)

    // Log transition if status changed
    if (updates.status) {
      await logTransition(run.id, stepState.id, userId, stepState.status, updates.status, 'user_action', 'step_viewed')
    }

    await logEvent(userId, 'step_viewed', {
      run_id: run.id,
      session_id,
      step_key,
      source_page,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /step/view error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/step/save
 * Record that a user saved progress on a step.
 * Triggers completion check and state sync.
 */
router.post('/step/save', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, session_id, metadata } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.json({ success: true, skipped: true })

    const stepState = await getStepState(run.id, step_key)
    if (!stepState) return res.json({ success: true, skipped: true })

    // Increment save count
    await supabaseAdmin
      .from('guided_step_states')
      .update({ save_count: (stepState.save_count || 0) + 1 })
      .eq('id', stepState.id)

    // Log the save event
    await logEvent(userId, 'step_saved', {
      run_id: run.id,
      session_id,
      step_key,
      metadata,
    })

    // Re-evaluate completion and sync
    const recommendation = await syncStepStates(supabaseAdmin, userId, run.id)

    // Check if this step is now complete
    const stepStatus = recommendation.step_statuses[step_key]
    if (stepStatus?.is_complete) {
      await logEvent(userId, 'step_completed', {
        run_id: run.id,
        session_id,
        step_key,
        completion_status: 'passed',
      })

      await logEvent(userId, 'completion_check_passed', {
        run_id: run.id,
        session_id,
        step_key,
      })

      // Auto-route to next step
      if (recommendation.next_step_key && recommendation.next_step_key !== step_key) {
        await logEvent(userId, 'auto_routed_to_next_step', {
          run_id: run.id,
          session_id,
          step_key: recommendation.next_step_key,
          source_page: step_key,
          target_page: recommendation.next_step_route,
        })
      }
    }

    res.json({
      success: true,
      data: {
        step_complete: stepStatus?.is_complete || false,
        completion_pct: stepStatus?.completion_pct || 0,
        next_step: recommendation.next_step_key,
        next_step_route: recommendation.next_step_route,
        is_path_complete: recommendation.is_path_complete,
      }
    })
  } catch (err) {
    console.error('[guidedPath] /step/save error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/step/complete
 * Explicitly mark a step as complete (manual override).
 * Still validates via completion engine.
 */
router.post('/step/complete', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, session_id, force } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.status(404).json({ error: 'No active guided path' })

    // Get step definition for completion rule
    const { data: stepDef } = await supabaseAdmin
      .from('guided_step_definitions')
      .select('*')
      .eq('path_version_id', run.path_version_id)
      .eq('step_key', step_key)
      .single()

    if (!stepDef) return res.status(404).json({ error: 'Step not found' })

    // Evaluate completion
    const context = { input_method: run.input_method, run_id: run.id }
    const result = await evaluateCompletionRule(supabaseAdmin, userId, stepDef.completion_rule, context)

    if (!result.is_complete && !force) {
      await logEvent(userId, 'completion_check_failed', {
        run_id: run.id,
        session_id,
        step_key,
        completion_status: 'failed',
        metadata: { missing_fields: result.missing_fields, completion_pct: result.completion_pct },
      })

      return res.status(400).json({
        success: false,
        error: 'Step completion criteria not met',
        data: result
      })
    }

    // Mark complete
    const stepState = await getStepState(run.id, step_key)
    if (stepState) {
      const prevStatus = stepState.status
      await supabaseAdmin
        .from('guided_step_states')
        .update({
          status: 'completed',
          completion_pct: 100,
          completed_at: new Date().toISOString(),
          completion_data: result,
        })
        .eq('id', stepState.id)

      await logTransition(run.id, stepState.id, userId, prevStatus, 'completed', 'user_action', 'manual_complete')
    }

    // Sync and get next
    const recommendation = await syncStepStates(supabaseAdmin, userId, run.id)

    await logEvent(userId, 'step_completed', {
      run_id: run.id,
      session_id,
      step_key,
      completion_status: 'passed',
    })

    res.json({
      success: true,
      data: {
        next_step: recommendation.next_step_key,
        next_step_route: recommendation.next_step_route,
        is_path_complete: recommendation.is_path_complete,
      }
    })
  } catch (err) {
    console.error('[guidedPath] /step/complete error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/step/skip
 * Skip a non-required step.
 */
router.post('/step/skip', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, session_id, reason } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.status(404).json({ error: 'No active guided path' })

    const stepState = await getStepState(run.id, step_key)
    if (!stepState) return res.status(404).json({ error: 'Step state not found' })

    const prevStatus = stepState.status

    await supabaseAdmin
      .from('guided_step_states')
      .update({
        status: 'skipped',
        skipped_at: new Date().toISOString(),
      })
      .eq('id', stepState.id)

    await logTransition(run.id, stepState.id, userId, prevStatus, 'skipped', 'user_action', reason || 'user_skip')

    await logEvent(userId, 'step_skipped', {
      run_id: run.id,
      session_id,
      step_key,
      metadata: { reason },
    })

    const recommendation = await syncStepStates(supabaseAdmin, userId, run.id)

    res.json({
      success: true,
      data: {
        next_step: recommendation.next_step_key,
        next_step_route: recommendation.next_step_route,
      }
    })
  } catch (err) {
    console.error('[guidedPath] /step/skip error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/guided-path/step/reopen
 * Reopen a completed or skipped step.
 */
router.post('/step/reopen', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, session_id } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.status(404).json({ error: 'No active guided path' })

    const stepState = await getStepState(run.id, step_key)
    if (!stepState) return res.status(404).json({ error: 'Step state not found' })

    const prevStatus = stepState.status

    await supabaseAdmin
      .from('guided_step_states')
      .update({ status: 'in_progress' })
      .eq('id', stepState.id)

    await logTransition(run.id, stepState.id, userId, prevStatus, 'in_progress', 'user_action', 'step_reopened')

    await logEvent(userId, 'step_reopened', {
      run_id: run.id,
      session_id,
      step_key,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /step/reopen error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// MANUAL NAVIGATION OVERRIDE
// ============================================================================

/**
 * POST /api/guided-path/navigate
 * User manually navigated away from the recommended step.
 */
router.post('/navigate', async (req, res) => {
  try {
    const userId = req.user.id
    const { step_key, source_page, target_page, session_id } = req.body

    const run = await getActiveRun(userId)
    if (!run) return res.json({ success: true, skipped: true })

    await supabaseAdmin
      .from('guided_path_runs')
      .update({ current_actual_step_key: step_key || null })
      .eq('id', run.id)

    await logEvent(userId, 'manual_navigation_override', {
      run_id: run.id,
      session_id,
      step_key,
      source_page,
      target_page,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /navigate error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// COMPLETION CHECK (read-only)
// ============================================================================

/**
 * GET /api/guided-path/check-step/:stepKey
 * Check completion status for a specific step without modifying state.
 */
router.get('/check-step/:stepKey', async (req, res) => {
  try {
    const userId = req.user.id
    const { stepKey } = req.params

    const run = await getActiveRun(userId)
    if (!run) return res.status(404).json({ error: 'No active guided path' })

    const { data: stepDef } = await supabaseAdmin
      .from('guided_step_definitions')
      .select('*')
      .eq('path_version_id', run.path_version_id)
      .eq('step_key', stepKey)
      .single()

    if (!stepDef) return res.status(404).json({ error: 'Step not found' })

    const context = { input_method: run.input_method, run_id: run.id }
    const result = await evaluateCompletionRule(supabaseAdmin, userId, stepDef.completion_rule, context)

    res.json({
      success: true,
      data: {
        step_key: stepKey,
        ...result,
      }
    })
  } catch (err) {
    console.error('[guidedPath] /check-step error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// EVENT LOGGING
// ============================================================================

/**
 * POST /api/guided-path/event
 * Generic event logging endpoint for frontend events.
 */
router.post('/event', async (req, res) => {
  try {
    const userId = req.user.id
    const {
      event_type, session_id, run_id, step_key, step_name,
      source_page, target_page, completion_status, input_method,
      triggered_by, duration_ms, metadata
    } = req.body

    await logEvent(userId, event_type, {
      run_id, session_id, step_key, step_name,
      source_page, target_page, completion_status, input_method,
      triggered_by: triggered_by || 'user_action',
      duration_ms, metadata,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('[guidedPath] /event error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================================================
// HELPERS
// ============================================================================

async function getActiveRun(userId) {
  const { data } = await supabaseAdmin
    .from('guided_path_runs')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['not_started', 'in_progress', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data
}

async function getStepState(runId, stepKey) {
  const { data } = await supabaseAdmin
    .from('guided_step_states')
    .select('*, guided_step_definitions!inner(step_key)')
    .eq('run_id', runId)
    .eq('guided_step_definitions.step_key', stepKey)
    .maybeSingle()

  return data
}

async function logEvent(userId, eventType, params = {}) {
  try {
    await supabaseAdmin.rpc('log_guided_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_session_id: params.session_id || null,
      p_run_id: params.run_id || null,
      p_step_key: params.step_key || null,
      p_step_name: params.step_name || null,
      p_source_page: params.source_page || null,
      p_target_page: params.target_page || null,
      p_completion_status: params.completion_status || null,
      p_input_method: params.input_method || null,
      p_triggered_by: params.triggered_by || 'system',
      p_duration_ms: params.duration_ms || null,
      p_metadata: params.metadata || {},
    })
  } catch (e) {
    console.warn('[guidedPath] Event logging failed:', e.message)
  }
}

async function logTransition(runId, stepStateId, userId, fromStatus, toStatus, triggeredBy, reason) {
  try {
    await supabaseAdmin
      .from('guided_step_transitions')
      .insert({
        run_id: runId,
        step_state_id: stepStateId,
        user_id: userId,
        from_status: fromStatus,
        to_status: toStatus,
        triggered_by: triggeredBy,
        reason,
      })
  } catch (e) {
    console.warn('[guidedPath] Transition logging failed:', e.message)
  }
}

export default router
