/**
 * Smart Guided Path — Completion Rules Engine
 *
 * Evaluates whether a step is complete by checking actual data in the database.
 * Each step has a JSON-serialized completion_rule that defines what "done" means.
 *
 * Rule types:
 *  - table_check:    required fields are non-null in a table row
 *  - min_count:      minimum number of rows exist
 *  - field_check:    a specific field equals/not-equals a value
 *  - compound:       all sub-rules must pass (AND)
 *  - conditional:    different rules depending on input_method
 *  - always_complete: terminal step, always true
 */

/**
 * Evaluate a completion rule for a given user.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - admin client (bypasses RLS)
 * @param {string} userId
 * @param {object} rule - parsed completion_rule JSON
 * @param {object} context - { input_method, run_id, ... }
 * @returns {Promise<{ is_complete: boolean, completion_pct: number, missing_fields?: string[], details?: object }>}
 */
export async function evaluateCompletionRule(supabase, userId, rule, context = {}) {
  switch (rule.type) {
    case 'always_complete':
      return { is_complete: true, completion_pct: 100 }

    case 'table_check':
      return evaluateTableCheck(supabase, userId, rule)

    case 'min_count':
      return evaluateMinCount(supabase, userId, rule)

    case 'field_check':
      return evaluateFieldCheck(supabase, userId, rule)

    case 'compound':
      return evaluateCompound(supabase, userId, rule, context)

    case 'conditional':
      return evaluateConditional(supabase, userId, rule, context)

    default:
      console.warn(`[CompletionEngine] Unknown rule type: ${rule.type}`)
      return { is_complete: false, completion_pct: 0, details: { error: `Unknown rule type: ${rule.type}` } }
  }
}

/**
 * table_check: Verify that a row exists with all required_fields non-null.
 */
async function evaluateTableCheck(supabase, userId, rule) {
  const { table, required_fields, match_column } = rule

  const { data, error } = await supabase
    .from(table)
    .select(required_fields.join(', '))
    .eq(match_column, userId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`[CompletionEngine] table_check error on ${table}:`, error.message)
    return { is_complete: false, completion_pct: 0, details: { error: error.message } }
  }

  if (!data) {
    return {
      is_complete: false,
      completion_pct: 0,
      missing_fields: required_fields,
      details: { reason: 'no_row_found' }
    }
  }

  const missing = required_fields.filter(f => {
    const val = data[f]
    if (val === null || val === undefined) return true
    if (typeof val === 'string' && val.trim() === '') return true
    if (Array.isArray(val) && val.length === 0) return true
    return false
  })

  const total = required_fields.length
  const filled = total - missing.length
  const pct = Math.round((filled / total) * 100)

  return {
    is_complete: missing.length === 0,
    completion_pct: pct,
    missing_fields: missing.length > 0 ? missing : undefined,
  }
}

/**
 * min_count: Check that at least N rows exist.
 * Supports join_through for tables linked via a parent (e.g., work_experience → user_resumes).
 */
async function evaluateMinCount(supabase, userId, rule) {
  const { table, min, match_column, join_through, extra_filter } = rule

  let query

  if (join_through) {
    // Two-step: first get the parent IDs, then count children
    const parentColumn = join_through === 'user_resumes' ? 'resume_id' : 'id'
    const { data: parents, error: parentErr } = await supabase
      .from(join_through)
      .select('id')
      .eq(match_column, userId)

    if (parentErr || !parents || parents.length === 0) {
      return { is_complete: false, completion_pct: 0, details: { reason: 'no_parent_rows' } }
    }

    const parentIds = parents.map(p => p.id)
    query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .in(parentColumn, parentIds)
  } else {
    query = supabase
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq(match_column, userId)
  }

  // Apply extra filters
  if (extra_filter) {
    if (extra_filter.equals) {
      query = query.eq(extra_filter.field, extra_filter.equals)
    }
    if (extra_filter.not_equals) {
      query = query.neq(extra_filter.field, extra_filter.not_equals)
    }
  }

  const { count, error } = await query

  if (error) {
    console.error(`[CompletionEngine] min_count error on ${table}:`, error.message)
    return { is_complete: false, completion_pct: 0, details: { error: error.message } }
  }

  const actual = count || 0
  const pct = Math.min(100, Math.round((actual / min) * 100))

  return {
    is_complete: actual >= min,
    completion_pct: pct,
    details: { actual_count: actual, required_min: min }
  }
}

/**
 * field_check: Verify a specific field value on a row.
 */
async function evaluateFieldCheck(supabase, userId, rule) {
  const { table, field, equals, not_equals, match_column } = rule

  const { data, error } = await supabase
    .from(table)
    .select(field)
    .eq(match_column, userId)
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { is_complete: false, completion_pct: 0 }
  }

  const value = data[field]
  let passed = true

  if (equals !== undefined) passed = value === equals
  if (not_equals !== undefined) passed = value !== not_equals

  return { is_complete: passed, completion_pct: passed ? 100 : 0 }
}

/**
 * compound: All sub-rules must pass (AND logic).
 */
async function evaluateCompound(supabase, userId, rule, context) {
  const results = await Promise.all(
    rule.rules.map(r => evaluateCompletionRule(supabase, userId, r, context))
  )

  const allComplete = results.every(r => r.is_complete)
  const avgPct = Math.round(results.reduce((s, r) => s + r.completion_pct, 0) / results.length)
  const allMissing = results.flatMap(r => r.missing_fields || [])

  return {
    is_complete: allComplete,
    completion_pct: avgPct,
    missing_fields: allMissing.length > 0 ? allMissing : undefined,
    details: { sub_results: results }
  }
}

/**
 * conditional: Pick the right rule based on context (e.g., input_method).
 */
async function evaluateConditional(supabase, userId, rule, context) {
  for (const condition of rule.conditions) {
    if (condition.default) {
      return evaluateCompletionRule(supabase, userId, condition.rule, context)
    }

    if (condition.when === 'input_method_is_resume_import' && context.input_method === 'resume_import') {
      return evaluateCompletionRule(supabase, userId, condition.rule, context)
    }

    if (condition.when === 'input_method_is_manual' && context.input_method === 'manual_experience_entry') {
      return evaluateCompletionRule(supabase, userId, condition.rule, context)
    }
  }

  // Fallback: find default condition
  const defaultCondition = rule.conditions.find(c => c.default)
  if (defaultCondition) {
    return evaluateCompletionRule(supabase, userId, defaultCondition.rule, context)
  }

  return { is_complete: false, completion_pct: 0, details: { error: 'no_matching_condition' } }
}
