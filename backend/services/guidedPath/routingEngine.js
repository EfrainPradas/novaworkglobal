/**
 * Smart Guided Path — Routing / Recommendation Engine
 *
 * Centralized logic that determines:
 *  - The next recommended step
 *  - Which steps are locked / unlocked
 *  - Whether a step is satisfied by imported data
 *  - Whether the user is returning to an incomplete step
 *  - Whether the entire path is complete
 *
 * This module is the single source of truth for routing decisions.
 * No UI component should duplicate this logic.
 */

import { evaluateCompletionRule } from './completionEngine.js'

/**
 * Resolve the next recommended step and full step status map.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - admin client
 * @param {string} userId
 * @param {string} runId
 * @returns {Promise<{
 *   next_step_key: string | null,
 *   next_step_route: string | null,
 *   next_step_display_name: string | null,
 *   reason: string,
 *   is_path_complete: boolean,
 *   step_statuses: Record<string, { status: string, is_complete: boolean, completion_pct: number, is_locked: boolean }>,
 *   steps_in_order: Array<{ step_key: string, display_name: string, route_path: string, step_order: number }>
 * }>}
 */
export async function resolveNextStep(supabase, userId, runId) {
  // 1. Fetch the run
  const { data: run, error: runErr } = await supabase
    .from('guided_path_runs')
    .select('*')
    .eq('id', runId)
    .single()

  if (runErr || !run) {
    throw new Error(`Run not found: ${runId}`)
  }

  // 2. Fetch step definitions (ordered)
  const { data: stepDefs, error: defErr } = await supabase
    .from('guided_step_definitions')
    .select('*')
    .eq('path_version_id', run.path_version_id)
    .order('step_order', { ascending: true })

  if (defErr || !stepDefs) {
    throw new Error('Failed to load step definitions')
  }

  // 3. Fetch current step states
  const { data: stepStates, error: stateErr } = await supabase
    .from('guided_step_states')
    .select('*')
    .eq('run_id', runId)

  if (stateErr) {
    throw new Error('Failed to load step states')
  }

  const stateMap = {}
  for (const ss of (stepStates || [])) {
    // Map step_definition_id → state
    stateMap[ss.step_definition_id] = ss
  }

  // 4. Evaluate completion for each step and build status map
  const context = { input_method: run.input_method, run_id: runId }
  const stepStatuses = {}
  const stepsInOrder = []
  const completedKeys = new Set()

  for (const def of stepDefs) {
    const state = stateMap[def.id]
    const currentStatus = state?.status || 'not_started'

    // Evaluate actual completion from data
    let completionResult
    try {
      completionResult = await evaluateCompletionRule(supabase, userId, def.completion_rule, context)
    } catch (e) {
      console.error(`[RoutingEngine] Completion check failed for ${def.step_key}:`, e.message)
      completionResult = { is_complete: false, completion_pct: 0 }
    }

    // Determine if step dependencies are met
    const depsCompleted = (def.depends_on_steps || []).every(depKey => completedKeys.has(depKey))
    const isLocked = !depsCompleted && currentStatus !== 'completed'

    // If data says complete and step wasn't explicitly marked, it's still complete
    if (completionResult.is_complete) {
      completedKeys.add(def.step_key)
    }

    stepStatuses[def.step_key] = {
      status: completionResult.is_complete ? 'completed' : (isLocked ? 'blocked' : currentStatus),
      is_complete: completionResult.is_complete,
      completion_pct: completionResult.completion_pct,
      is_locked: isLocked,
      missing_fields: completionResult.missing_fields,
    }

    stepsInOrder.push({
      step_key: def.step_key,
      display_name: def.display_name,
      route_path: def.route_path,
      step_order: def.step_order,
      is_required: def.is_required,
      is_terminal: def.is_terminal,
    })
  }

  // 5. Find the next recommended step
  let nextStep = null
  let reason = 'path_complete'

  // First pass: find the first incomplete required step
  for (const step of stepsInOrder) {
    const status = stepStatuses[step.step_key]

    if (step.is_terminal) {
      // Terminal step: if all prior required steps are complete, path is done
      const allPriorComplete = stepsInOrder
        .filter(s => !s.is_terminal && s.is_required)
        .every(s => stepStatuses[s.step_key].is_complete)

      if (allPriorComplete) {
        nextStep = step
        reason = 'path_complete'
        break
      }
      continue
    }

    if (!status.is_complete && !status.is_locked) {
      nextStep = step
      // Determine reason
      if (status.status === 'in_progress') {
        reason = 'incomplete_prior'
      } else if (step.step_order === 1) {
        reason = 'first_step'
      } else {
        reason = 'next_in_sequence'
      }
      break
    }
  }

  const isPathComplete = reason === 'path_complete' && nextStep?.is_terminal

  return {
    next_step_key: nextStep?.step_key || null,
    next_step_route: nextStep?.route_path || null,
    next_step_display_name: nextStep?.display_name || null,
    reason,
    is_path_complete: isPathComplete,
    step_statuses: stepStatuses,
    steps_in_order: stepsInOrder,
  }
}

/**
 * Sync step states in the DB to reflect actual data completion.
 * Called after a user saves progress or navigates back.
 *
 * This ensures the DB step states are always accurate,
 * even if the user edited data outside the guided flow.
 */
export async function syncStepStates(supabase, userId, runId) {
  const recommendation = await resolveNextStep(supabase, userId, runId)

  // Update the run's pointers
  const updates = {
    current_recommended_step_key: recommendation.next_step_key,
  }

  // Find last completed step
  const lastCompleted = [...recommendation.steps_in_order]
    .reverse()
    .find(s => recommendation.step_statuses[s.step_key]?.is_complete && !s.is_terminal)

  if (lastCompleted) {
    updates.last_completed_step_key = lastCompleted.step_key
  }

  // If path complete, update run status
  if (recommendation.is_path_complete) {
    updates.status = 'completed'
    updates.completed_at = new Date().toISOString()
  }

  await supabase
    .from('guided_path_runs')
    .update(updates)
    .eq('id', runId)

  // Update individual step states
  const { data: stepDefs } = await supabase
    .from('guided_step_definitions')
    .select('id, step_key')
    .eq('path_version_id', (await supabase.from('guided_path_runs').select('path_version_id').eq('id', runId).single()).data.path_version_id)

  const defMap = {}
  for (const d of (stepDefs || [])) {
    defMap[d.step_key] = d.id
  }

  for (const [stepKey, status] of Object.entries(recommendation.step_statuses)) {
    const defId = defMap[stepKey]
    if (!defId) continue

    const updateData = {
      completion_pct: status.completion_pct,
    }

    // Only promote status forward (don't downgrade completed to available)
    if (status.is_complete) {
      updateData.status = 'completed'
      updateData.completed_at = new Date().toISOString()
    } else if (status.is_locked) {
      updateData.status = 'blocked'
    } else if (status.status === 'not_started' && !status.is_locked) {
      updateData.status = 'available'
    }

    await supabase
      .from('guided_step_states')
      .update(updateData)
      .eq('run_id', runId)
      .eq('step_definition_id', defId)
  }

  return recommendation
}
