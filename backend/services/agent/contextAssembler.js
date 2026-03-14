// backend/services/agent/contextAssembler.js
// Fetches the minimum required context from Supabase based on intent

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Intents that require a content payload (actual CAR/accomplishment records)
const CONTENT_REVIEW_INTENTS = new Set([
  'car_critique_single',
  'car_critique_portfolio',
  'car_rewrite_request',
  'accomplishment_to_car',
  'identify_best_for_interview',
  'identify_best_for_resume',
  'identify_best_for_linkedin',
  'compare_stories',
]);

// Intents that require coaching context (coach role only)
const COACHING_INTENTS = new Set([
  'client_summary_request',
  'client_bottleneck_detection',
  'session_preparation_help',
  'suggest_next_best_action',
]);

/**
 * Assemble agent context bundle for a given user + intent
 * @param {string} userId
 * @param {string} role - 'client' | 'coach'
 * @param {string} intent
 * @param {object} extras - { clientId?, limit? }
 */
export async function assembleContext(userId, role, intent, extras = {}) {
  const tablesAccessed = [];
  const context = {};

  // Always: get base agent context (onboarding, resume readiness, CAR readiness)
  const { data: agentCtx, error: ctxError } = await supabase
    .rpc('get_agent_context', { p_user_id: userId });

  if (ctxError) {
    console.error('[contextAssembler] get_agent_context error:', ctxError.message);
  } else {
    context.base = agentCtx;
    tablesAccessed.push('users', 'user_resumes', 'par_stories', 'accomplishment_bank',
                        'coach_clients', 'coaching_sessions', 'coaching_goals',
                        'onboarding_responses', 'career_vision_profiles',
                        'positioning_questionnaire', 'generated_professional_profile');
  }

  // Content review: fetch actual records
  if (CONTENT_REVIEW_INTENTS.has(intent)) {
    const limit = intent === 'car_critique_portfolio' ? 10 : 5;

    const [carResult, accResult] = await Promise.all([
      supabase.rpc('get_car_stories_for_review', { p_user_id: userId, p_limit: limit }),
      supabase.rpc('get_accomplishments_for_review', { p_user_id: userId, p_limit: limit }),
    ]);

    context.car_stories = carResult.data || [];
    context.accomplishments = accResult.data || [];
    context.content_scope = intent === 'car_critique_portfolio' ? 'portfolio' : 'snapshot';
    tablesAccessed.push('par_stories', 'accomplishment_bank');
  }

  // Coach support: fetch client summary
  if (role === 'coach' && COACHING_INTENTS.has(intent) && extras.clientId) {
    const { data: coachSummary, error: coachErr } = await supabase
      .rpc('get_coach_client_summary', {
        p_coach_id: userId,
        p_client_id: extras.clientId,
      });

    if (coachErr) {
      console.error('[contextAssembler] get_coach_client_summary error:', coachErr.message);
      context.coach_client_summary = null;
    } else {
      context.coach_client_summary = coachSummary;
      tablesAccessed.push('coach_clients', 'coaching_sessions', 'coaching_goals',
                          'par_stories', 'accomplishment_bank');
    }
  }

  // Support diagnostics: for stuck user or bug intents
  if (['workflow_recovery', 'possible_bug', 'stuck_user_help'].includes(intent)) {
    const { data: signals } = await supabase
      .rpc('get_support_signals', { p_user_id: userId, p_days: 7 });
    context.support_signals = signals || [];
    tablesAccessed.push('event_logs');
  }

  return {
    context,
    tablesAccessed: [...new Set(tablesAccessed)],
    rowsRetrieved: countRows(context),
  };
}

function countRows(ctx) {
  let count = 0;
  if (ctx.car_stories) count += ctx.car_stories.length;
  if (ctx.accomplishments) count += ctx.accomplishments.length;
  if (ctx.support_signals) count += ctx.support_signals.length;
  if (ctx.coach_client_summary) count += 1;
  if (ctx.base) count += 1;
  return count;
}
