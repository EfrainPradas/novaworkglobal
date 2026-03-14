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

// Intents that need actual content rows from profile tables
const PROFILE_CONTENT_INTENTS = new Set([
  'career_vision_content',
  'positioning_content',
  'professional_profile_content',
  'my_values',
  'my_strengths',
  'my_skills',
  'suggest_next_best_action',
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
 */
export async function assembleContext(userId, role, intent, extras = {}) {
  const tablesAccessed = [];
  const context = {};

  // Always: get base agent context (signals / counts)
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

  // === PROFILE CONTENT FETCH ===
  // For profile-related intents, fetch actual row content (not just boolean signals)
  if (PROFILE_CONTENT_INTENTS.has(intent)) {
    const [cvResult, pqResult, ppResult, obResult] = await Promise.all([
      // Career Vision Profile
      supabase
        .from('career_vision_profiles')
        .select('skills_knowledge, core_values, interests, career_vision_statement, job_history_insights')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Positioning Questionnaire (key positioning fields)
      supabase
        .from('positioning_questionnaire')
        .select('identity_current_title, identity_target_title, identity_one_phrase, years_experience_bucket, industries, environments, functions, trusted_problems, impact_types, strengths, colleagues_describe, differentiator, technical_skills_tools, certifications_advanced_training, platforms_systems, methodologies, languages_spoken, core_mandate_verb, core_mandate_objective, fin_annual_spend, fin_revenue_impact, lead_direct_reports, lead_total_team, complexity_factors')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Generated Professional Profile
      supabase
        .from('generated_professional_profile')
        .select('output_identity_sentence, output_blended_value_sentence, output_competency_paragraph, output_areas_of_excellence, output_skills_section, version')
        .eq('user_id', userId)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Onboarding responses
      supabase
        .from('onboarding_responses')
        .select('current_situation, top_priority, target_job_title, skills, interests, values, values_reasoning')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle(),
    ]);

    if (cvResult.data)  { context.career_vision       = cvResult.data;  tablesAccessed.push('career_vision_profiles'); }
    if (pqResult.data)  { context.positioning          = pqResult.data;  tablesAccessed.push('positioning_questionnaire'); }
    if (ppResult.data)  { context.professional_profile = ppResult.data;  tablesAccessed.push('generated_professional_profile'); }
    if (obResult.data)  { context.onboarding           = obResult.data;  tablesAccessed.push('onboarding_responses'); }
  }

  // Content review: fetch actual CAR/accomplishment records
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
      .rpc('get_coach_client_summary', { p_coach_id: userId, p_client_id: extras.clientId });

    if (coachErr) {
      console.error('[contextAssembler] get_coach_client_summary error:', coachErr.message);
      context.coach_client_summary = null;
    } else {
      context.coach_client_summary = coachSummary;
      tablesAccessed.push('coach_clients', 'coaching_sessions', 'coaching_goals');
    }
  }

  // Support diagnostics
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
  if (ctx.car_stories)         count += ctx.car_stories.length;
  if (ctx.accomplishments)     count += ctx.accomplishments.length;
  if (ctx.support_signals)     count += ctx.support_signals.length;
  if (ctx.coach_client_summary) count += 1;
  if (ctx.career_vision)       count += 1;
  if (ctx.positioning)         count += 1;
  if (ctx.professional_profile) count += 1;
  if (ctx.onboarding)          count += 1;
  if (ctx.base)                count += 1;
  return count;
}
