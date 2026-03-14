ñ-- ============================================================
-- Super Support Agent — Database Infrastructure
-- Migration: agent infrastructure
-- ============================================================

-- 1. Audit log table for agent interactions
CREATE TABLE IF NOT EXISTS agent_interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('client', 'coach', 'admin')),
  session_id TEXT,
  intent TEXT,
  context_tables_accessed TEXT[],
  rows_retrieved INTEGER DEFAULT 0,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  model_used TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_user_id ON agent_interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_interaction_logs(created_at DESC);

-- RLS: users can only see their own logs; service role sees all
ALTER TABLE agent_interaction_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY agent_logs_own ON agent_interaction_logs
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================
-- 2. View: agent_resume_readiness
-- Returns resume completeness signals per user
-- ============================================================
CREATE OR REPLACE VIEW agent_resume_readiness AS
SELECT
  ur.user_id,
  ur.id AS resume_id,
  ur.is_master,
  ur.resume_type,
  (ur.profile_summary IS NOT NULL AND ur.profile_summary != '') AS has_profile_summary,
  (ur.areas_of_excellence IS NOT NULL) AS has_areas_of_excellence,
  COUNT(DISTINCT we.id) AS work_experience_count,
  COUNT(DISTINCT edu.id) AS education_count,
  COUNT(DISTINCT cert.id) AS certification_count
FROM user_resumes ur
LEFT JOIN work_experience we ON we.resume_id = ur.id
LEFT JOIN education edu ON edu.resume_id = ur.id
LEFT JOIN certifications cert ON cert.resume_id = ur.id
WHERE ur.is_master = true
GROUP BY ur.user_id, ur.id, ur.is_master, ur.resume_type, ur.profile_summary, ur.areas_of_excellence;

-- ============================================================
-- 3. View: agent_car_readiness
-- Returns CAR/accomplishment coverage signals per user
-- ============================================================
CREATE OR REPLACE VIEW agent_car_readiness AS
SELECT
  u.id AS user_id,
  COALESCE(ps_counts.car_story_count, 0) AS car_story_count,
  COALESCE(ab_counts.bank_count, 0) AS accomplishment_bank_count,
  COALESCE(acc_counts.work_linked_count, 0) AS accomplishments_linked_to_work,
  COALESCE(acc_counts.car_linked_count, 0) AS accomplishments_linked_to_car
FROM users u
LEFT JOIN (
  SELECT user_id, COUNT(*) AS car_story_count FROM par_stories GROUP BY user_id
) ps_counts ON ps_counts.user_id = u.id
LEFT JOIN (
  SELECT user_id, COUNT(*) AS bank_count FROM accomplishment_bank GROUP BY user_id
) ab_counts ON ab_counts.user_id = u.id
LEFT JOIN (
  SELECT
    we.resume_id,
    COUNT(CASE WHEN a.work_experience_id IS NOT NULL THEN 1 END) AS work_linked_count,
    COUNT(CASE WHEN a.par_story_id IS NOT NULL THEN 1 END) AS car_linked_count
  FROM accomplishments a
  JOIN work_experience we ON we.id = a.work_experience_id
  GROUP BY we.resume_id
) acc_counts ON acc_counts.resume_id IN (
  SELECT id FROM user_resumes WHERE user_id = u.id AND is_master = true LIMIT 1
);

-- ============================================================
-- 4. RPC: get_agent_context
-- Assembles the full context bundle for one user in one call
-- ============================================================
CREATE OR REPLACE FUNCTION get_agent_context(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user RECORD;
  v_resume RECORD;
  v_onboarding RECORD;
  v_car RECORD;
  v_coaching RECORD;
BEGIN
  -- User identity
  SELECT id, email, full_name, is_coach, onboarding_completed
  INTO v_user
  FROM users WHERE id = p_user_id;

  -- Resume readiness
  SELECT * INTO v_resume
  FROM agent_resume_readiness
  WHERE user_id = p_user_id
  LIMIT 1;

  -- Onboarding signals
  SELECT
    (SELECT COUNT(*) > 0 FROM onboarding_responses WHERE user_id = p_user_id) AS has_onboarding,
    (SELECT COUNT(*) > 0 FROM career_vision_profiles WHERE user_id = p_user_id) AS has_career_vision,
    (SELECT COUNT(*) > 0 FROM positioning_questionnaire WHERE user_id = p_user_id) AS has_positioning,
    (SELECT COUNT(*) > 0 FROM generated_professional_profile WHERE user_id = p_user_id) AS has_generated_profile
  INTO v_onboarding;

  -- CAR readiness (simplified counts)
  SELECT
    (SELECT COUNT(*) FROM par_stories WHERE user_id = p_user_id) AS car_count,
    (SELECT COUNT(*) FROM accomplishment_bank WHERE user_id = p_user_id) AS bank_count
  INTO v_car;

  -- Coaching relationship
  SELECT
    (SELECT COUNT(*) > 0 FROM coach_clients WHERE client_id = p_user_id AND status = 'active') AS has_active_coach,
    (SELECT COUNT(*) FROM coaching_sessions WHERE client_id = p_user_id AND status = 'scheduled') AS upcoming_sessions,
    (SELECT COUNT(*) FROM coaching_goals WHERE client_id = p_user_id) AS goal_count
  INTO v_coaching;

  RETURN json_build_object(
    'identity', json_build_object(
      'user_id', v_user.id,
      'email', v_user.email,
      'full_name', v_user.full_name,
      'is_coach', v_user.is_coach,
      'onboarding_completed', v_user.onboarding_completed,
      'role', CASE WHEN v_user.is_coach THEN 'coach' ELSE 'client' END
    ),
    'onboarding', json_build_object(
      'has_onboarding_response', v_onboarding.has_onboarding,
      'has_career_vision', v_onboarding.has_career_vision,
      'has_positioning_questionnaire', v_onboarding.has_positioning,
      'has_generated_profile', v_onboarding.has_generated_profile
    ),
    'resume', json_build_object(
      'has_master_resume', v_resume.resume_id IS NOT NULL,
      'resume_id', v_resume.resume_id,
      'resume_type', v_resume.resume_type,
      'has_profile_summary', COALESCE(v_resume.has_profile_summary, false),
      'work_experience_count', COALESCE(v_resume.work_experience_count, 0),
      'education_count', COALESCE(v_resume.education_count, 0),
      'certification_count', COALESCE(v_resume.certification_count, 0)
    ),
    'car', json_build_object(
      'car_story_count', COALESCE(v_car.car_count, 0),
      'accomplishment_bank_count', COALESCE(v_car.bank_count, 0),
      'has_any_car', COALESCE(v_car.car_count, 0) > 0
    ),
    'coaching', json_build_object(
      'has_active_coach', COALESCE(v_coaching.has_active_coach, false),
      'upcoming_session_count', COALESCE(v_coaching.upcoming_sessions, 0),
      'active_goal_count', COALESCE(v_coaching.goal_count, 0)
    )
  );
END;
$$;

-- ============================================================
-- 5. RPC: get_car_stories_for_review
-- Fetches actual CAR story content for agent review
-- ============================================================
DROP FUNCTION IF EXISTS get_car_stories_for_review(UUID, INT);
CREATE OR REPLACE FUNCTION get_car_stories_for_review(
  p_user_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  role_title TEXT,
  company_name TEXT,
  problem_challenge TEXT,
  actions TEXT,
  result TEXT,
  metrics TEXT,
  skills_tags TEXT[],
  competencies TEXT[],
  status TEXT,
  year TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    role_title,
    company_name,
    problem_challenge,
    actions,
    result,
    metrics,
    skills_tags,
    competencies,
    status,
    year,
    created_at
  FROM par_stories
  WHERE user_id = p_user_id
  ORDER BY created_at DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- 6. RPC: get_accomplishments_for_review
-- Fetches actual accomplishment bank entries for review
-- ============================================================
DROP FUNCTION IF EXISTS get_accomplishments_for_review(UUID, INT);
CREATE OR REPLACE FUNCTION get_accomplishments_for_review(
  p_user_id UUID,
  p_limit INT DEFAULT 5
)
RETURNS TABLE(
  id UUID,
  bullet_text TEXT,
  role_title TEXT,
  company_name TEXT,
  source TEXT,
  skills TEXT[],
  competencies TEXT[],
  is_starred BOOLEAN,
  times_used INT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    id,
    bullet_text,
    role_title,
    company_name,
    source,
    skills,
    competencies,
    is_starred,
    times_used,
    created_at
  FROM accomplishment_bank
  WHERE user_id = p_user_id
  ORDER BY is_starred DESC, times_used DESC, created_at DESC
  LIMIT p_limit;
$$;

-- ============================================================
-- 7. RPC: get_coach_client_summary
-- Fetches client state for a coach (access-controlled)
-- ============================================================
CREATE OR REPLACE FUNCTION get_coach_client_summary(
  p_coach_id UUID,
  p_client_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_relationship RECORD;
  v_client RECORD;
  v_sessions_completed INT;
  v_upcoming_sessions INT;
  v_goal_count INT;
  v_car_count INT;
  v_bank_count INT;
BEGIN
  -- Safety: verify coach-client relationship exists
  SELECT * INTO v_relationship
  FROM coach_clients
  WHERE coach_id = p_coach_id AND client_id = p_client_id
  LIMIT 1;

  IF v_relationship IS NULL THEN
    RAISE EXCEPTION 'Access denied: no coach-client relationship found';
  END IF;

  -- Client info
  SELECT full_name, email, onboarding_completed INTO v_client
  FROM users WHERE id = p_client_id;

  -- Session counts
  SELECT COUNT(*) INTO v_sessions_completed
  FROM coaching_sessions
  WHERE coach_client_id = v_relationship.id AND status = 'completed';

  SELECT COUNT(*) INTO v_upcoming_sessions
  FROM coaching_sessions
  WHERE coach_client_id = v_relationship.id AND status = 'scheduled';

  -- Goals
  SELECT COUNT(*) INTO v_goal_count
  FROM coaching_goals WHERE coach_client_id = v_relationship.id;

  -- CAR readiness
  SELECT COUNT(*) INTO v_car_count FROM par_stories WHERE user_id = p_client_id;
  SELECT COUNT(*) INTO v_bank_count FROM accomplishment_bank WHERE user_id = p_client_id;

  RETURN json_build_object(
    'relationship', json_build_object(
      'status', v_relationship.status,
      'program_type', v_relationship.program_type,
      'sessions_planned', v_relationship.sessions_planned,
      'sessions_completed', v_sessions_completed,
      'upcoming_sessions', v_upcoming_sessions,
      'engagement_notes', v_relationship.engagement_notes
    ),
    'client', json_build_object(
      'full_name', v_client.full_name,
      'email', v_client.email,
      'onboarding_completed', v_client.onboarding_completed
    ),
    'progress', json_build_object(
      'car_story_count', v_car_count,
      'accomplishment_bank_count', v_bank_count,
      'active_goal_count', v_goal_count
    )
  );
END;
$$;

-- ============================================================
-- 8. RPC: log_agent_interaction
-- ============================================================
CREATE OR REPLACE FUNCTION log_agent_interaction(
  p_user_id UUID,
  p_role TEXT,
  p_session_id TEXT,
  p_intent TEXT,
  p_context_tables TEXT[],
  p_rows_retrieved INT,
  p_prompt_tokens INT,
  p_completion_tokens INT,
  p_model TEXT
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO agent_interaction_logs (
    user_id, role, session_id, intent,
    context_tables_accessed, rows_retrieved,
    prompt_tokens, completion_tokens, model_used
  ) VALUES (
    p_user_id, p_role, p_session_id, p_intent,
    p_context_tables, p_rows_retrieved,
    p_prompt_tokens, p_completion_tokens, p_model
  );
$$;

-- ============================================================
-- 9. RPC: get_support_signals
-- Fetches recent event signal diagnostics
-- ============================================================
DROP FUNCTION IF EXISTS get_support_signals(UUID, INT);
CREATE OR REPLACE FUNCTION get_support_signals(
  p_user_id UUID,
  p_days INT DEFAULT 7
)
RETURNS TABLE(
  event_name TEXT,
  event_category TEXT,
  event_timestamp TIMESTAMPTZ,
  target_entity_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT event_name, event_category, event_timestamp, target_entity_type
  FROM event_logs
  WHERE user_id = p_user_id
    AND event_timestamp >= NOW() - (p_days || ' days')::INTERVAL
  ORDER BY event_timestamp DESC
  LIMIT 20;
$$;
