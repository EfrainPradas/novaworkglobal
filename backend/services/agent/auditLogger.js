// backend/services/agent/auditLogger.js
// Writes interaction logs to agent_interaction_logs via Supabase RPC

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Log an agent interaction for audit and observability
 */
export async function logAgentInteraction({
  userId,
  role,
  sessionId,
  intent,
  tablesAccessed = [],
  rowsRetrieved = 0,
  promptTokens = 0,
  completionTokens = 0,
  model = 'gpt-4o',
}) {
  try {
    await supabase.rpc('log_agent_interaction', {
      p_user_id: userId,
      p_role: role,
      p_session_id: sessionId,
      p_intent: intent,
      p_context_tables: tablesAccessed,
      p_rows_retrieved: rowsRetrieved,
      p_prompt_tokens: promptTokens,
      p_completion_tokens: completionTokens,
      p_model: model,
    });
  } catch (err) {
    // Non-fatal: log to console but don't fail the request
    console.error('[auditLogger] Failed to log interaction:', err.message);
  }
}
