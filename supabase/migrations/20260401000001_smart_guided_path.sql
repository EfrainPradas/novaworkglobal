-- ============================================================================
-- SMART GUIDED PATH — Database Schema
-- Created: 2026-04-01
-- Purpose: Backend-driven guided experience for resume-building platform
-- ============================================================================

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- Path-level status
CREATE TYPE guided_path_status AS ENUM (
  'not_started',
  'in_progress',
  'paused',
  'completed',
  'abandoned'
);

-- Step-level status
CREATE TYPE guided_step_status AS ENUM (
  'not_started',
  'available',
  'in_progress',
  'completed',
  'skipped',
  'blocked'
);

-- Input method for experience capture branching
CREATE TYPE guided_input_method AS ENUM (
  'resume_import',
  'manual_experience_entry',
  'not_selected'
);

-- Who triggered the action
CREATE TYPE guided_trigger_source AS ENUM (
  'system',        -- auto-routing, completion checks
  'user_action',   -- explicit user clicks
  'admin',         -- coach/admin override
  'api'            -- external system call
);

-- Event types for process mining
CREATE TYPE guided_event_type AS ENUM (
  'guided_mode_enabled',
  'guided_mode_disabled',
  'guided_path_started',
  'guided_path_paused',
  'guided_path_resumed',
  'guided_path_completed',
  'guided_path_abandoned',
  'step_unlocked',
  'step_viewed',
  'step_started',
  'step_saved',
  'step_completed',
  'step_skipped',
  'step_reopened',
  'step_blocked',
  'auto_routed_to_next_step',
  'manual_navigation_override',
  'input_method_selected',
  'completion_check_passed',
  'completion_check_failed',
  'branching_decision'
);

-- ============================================================================
-- 2. GUIDED PATH DEFINITIONS (template / versioned)
-- ============================================================================

CREATE TABLE guided_path_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_key TEXT NOT NULL UNIQUE,             -- 'smart_guided_path'
  display_name TEXT NOT NULL,                -- 'Smart Guided Path'
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE guided_path_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_definition_id UUID NOT NULL REFERENCES guided_path_definitions(id),
  version_number INTEGER NOT NULL DEFAULT 1,
  version_label TEXT,                        -- 'v1.0', 'v1.1-beta'
  is_current BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',                 -- version-level config overrides
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(path_definition_id, version_number)
);

-- ============================================================================
-- 3. STEP DEFINITIONS (template — what steps exist in a path version)
-- ============================================================================

CREATE TABLE guided_step_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_version_id UUID NOT NULL REFERENCES guided_path_versions(id) ON DELETE CASCADE,
  step_key TEXT NOT NULL,                    -- 'profile_basic_info', 'car_stories', etc.
  display_name TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,               -- 1, 2, 3...

  -- Routing metadata
  route_path TEXT,                           -- '/dashboard/resume-builder/contact-info'

  -- Branching
  is_branching_point BOOLEAN NOT NULL DEFAULT false,
  branch_options JSONB,                      -- [{"key":"resume_import","label":"Import Resume"},...]
  parent_step_key TEXT,                      -- for sub-steps under a branch

  -- Completion config
  completion_rule JSONB NOT NULL DEFAULT '{}',  -- serialized completion criteria
  is_required BOOLEAN NOT NULL DEFAULT true,
  is_terminal BOOLEAN NOT NULL DEFAULT false,   -- true for 'guided_path_complete'

  -- Dependencies
  depends_on_steps TEXT[] DEFAULT '{}',      -- step_keys that must be completed first

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(path_version_id, step_key)
);

CREATE INDEX idx_step_definitions_version ON guided_step_definitions(path_version_id);
CREATE INDEX idx_step_definitions_order ON guided_step_definitions(path_version_id, step_order);

-- ============================================================================
-- 4. GUIDED PATH RUNS (per-user instance of a path)
-- ============================================================================

CREATE TABLE guided_path_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_version_id UUID NOT NULL REFERENCES guided_path_versions(id),

  -- State
  status guided_path_status NOT NULL DEFAULT 'not_started',
  guidance_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Input method branching
  input_method guided_input_method NOT NULL DEFAULT 'not_selected',

  -- Progress pointers
  last_completed_step_key TEXT,
  current_recommended_step_key TEXT,
  current_actual_step_key TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  abandoned_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}',              -- flexible storage

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active run per user (can have completed runs for history)
  UNIQUE(user_id, path_version_id)
);

CREATE INDEX idx_path_runs_user ON guided_path_runs(user_id);
CREATE INDEX idx_path_runs_status ON guided_path_runs(status);
CREATE INDEX idx_path_runs_user_active ON guided_path_runs(user_id) WHERE status IN ('in_progress', 'paused');

-- ============================================================================
-- 5. STEP STATES (per-user step progress within a run)
-- ============================================================================

CREATE TABLE guided_step_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES guided_path_runs(id) ON DELETE CASCADE,
  step_definition_id UUID NOT NULL REFERENCES guided_step_definitions(id),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- State
  status guided_step_status NOT NULL DEFAULT 'not_started',

  -- Completion data
  completion_data JSONB DEFAULT '{}',       -- what was validated
  completion_pct SMALLINT DEFAULT 0 CHECK (completion_pct BETWEEN 0 AND 100),

  -- Timestamps
  first_viewed_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,

  -- Visit count (for rework analysis)
  view_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(run_id, step_definition_id)
);

CREATE INDEX idx_step_states_run ON guided_step_states(run_id);
CREATE INDEX idx_step_states_user ON guided_step_states(user_id);
CREATE INDEX idx_step_states_status ON guided_step_states(status);

-- ============================================================================
-- 6. STEP TRANSITIONS (audit trail of state changes)
-- ============================================================================

CREATE TABLE guided_step_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES guided_path_runs(id) ON DELETE CASCADE,
  step_state_id UUID NOT NULL REFERENCES guided_step_states(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  from_status guided_step_status,
  to_status guided_step_status NOT NULL,
  triggered_by guided_trigger_source NOT NULL DEFAULT 'system',

  reason TEXT,                               -- 'auto_advance', 'user_skip', etc.
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_step_transitions_run ON guided_step_transitions(run_id);
CREATE INDEX idx_step_transitions_step ON guided_step_transitions(step_state_id);
CREATE INDEX idx_step_transitions_time ON guided_step_transitions(created_at);

-- ============================================================================
-- 7. GUIDED PATH EVENTS (process mining / analytics)
-- ============================================================================

CREATE TABLE guided_path_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,                           -- browser session ID
  run_id UUID REFERENCES guided_path_runs(id) ON DELETE SET NULL,

  -- Event classification
  event_type guided_event_type NOT NULL,
  path_version_id UUID REFERENCES guided_path_versions(id),

  -- Step context
  step_key TEXT,
  step_name TEXT,

  -- Navigation context
  source_page TEXT,                          -- where the user was
  target_page TEXT,                          -- where they're going

  -- Completion context
  completion_status TEXT,                    -- 'passed', 'failed', 'partial'
  input_method guided_input_method,
  triggered_by guided_trigger_source NOT NULL DEFAULT 'system',

  -- Timing
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,                       -- time spent on step

  -- Flexible payload
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Process mining indexes: optimized for time-series, funnel, and cohort queries
CREATE INDEX idx_events_user ON guided_path_events(user_id);
CREATE INDEX idx_events_run ON guided_path_events(run_id);
CREATE INDEX idx_events_type ON guided_path_events(event_type);
CREATE INDEX idx_events_timestamp ON guided_path_events(event_timestamp);
CREATE INDEX idx_events_step ON guided_path_events(step_key);
CREATE INDEX idx_events_session ON guided_path_events(session_id);
CREATE INDEX idx_events_user_time ON guided_path_events(user_id, event_timestamp);
CREATE INDEX idx_events_run_time ON guided_path_events(run_id, event_timestamp);

-- Composite for funnel analysis
CREATE INDEX idx_events_funnel ON guided_path_events(path_version_id, step_key, event_type);

-- ============================================================================
-- 8. SEED DATA — Smart Guided Path v1
-- ============================================================================

-- Path definition
INSERT INTO guided_path_definitions (id, path_key, display_name, description)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'smart_guided_path',
  'Smart Guided Path',
  'Guided experience to build a professional foundation before generating a high-quality resume'
);

-- Version 1
INSERT INTO guided_path_versions (id, path_definition_id, version_number, version_label, is_current, published_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  1,
  'v1.0',
  true,
  now()
);

-- Step definitions for v1
INSERT INTO guided_step_definitions (path_version_id, step_key, display_name, description, step_order, route_path, is_branching_point, branch_options, is_required, is_terminal, depends_on_steps, completion_rule) VALUES

-- Step 1: Profile Basic Info
('b0000000-0000-0000-0000-000000000001',
 'profile_basic_info',
 'Basic Profile & Contact Info',
 'Complete your basic profile and contact information',
 1,
 '/dashboard/resume-builder/contact-info',
 false, NULL, true, false, '{}',
 '{"type": "table_check", "table": "user_contact_profiles", "required_fields": ["first_name", "last_name", "email", "phone", "country", "state", "city"], "match_column": "user_id"}'
),

-- Step 2: Experience Capture (branching point)
('b0000000-0000-0000-0000-000000000001',
 'resume_experience_capture',
 'Experience Capture Method',
 'Choose how to enter your work experience: import a resume or enter manually',
 2,
 '/dashboard/resume-builder/work-experience',
 true,
 '[{"key": "resume_import", "label": "Import Resume", "route": "/dashboard/resume-builder/import"}, {"key": "manual_experience_entry", "label": "Enter Manually", "route": "/dashboard/resume-builder/work-experience"}]',
 true, false, '{profile_basic_info}',
 '{"type": "compound", "rules": [{"type": "field_check", "table": "guided_path_runs", "field": "input_method", "not_equals": "not_selected", "match_column": "user_id"}, {"type": "min_count", "table": "work_experience", "min": 1, "join_through": "user_resumes", "match_column": "user_id"}]}'
),

-- Step 3: Experience Foundation
('b0000000-0000-0000-0000-000000000001',
 'experience_foundation',
 'Experience Foundation',
 'Complete your work experience, education, certifications, and awards',
 3,
 '/dashboard/resume-builder/work-experience',
 false, NULL, true, false, '{resume_experience_capture}',
 '{"type": "compound", "rules": [{"type": "min_count", "table": "work_experience", "min": 1, "join_through": "user_resumes", "match_column": "user_id"}, {"type": "min_count", "table": "education", "min": 1, "join_through": "user_resumes", "match_column": "user_id"}]}'
),

-- Step 4: Accomplishment Bank
('b0000000-0000-0000-0000-000000000001',
 'accomplishment_bank',
 'Accomplishment Bank',
 'Build your library of professional accomplishments',
 4,
 '/dashboard/resume-builder/accomplishments',
 false, NULL, true, false, '{experience_foundation}',
 '{"type": "conditional", "conditions": [{"when": "input_method_is_resume_import", "rule": {"type": "min_count", "table": "accomplishment_bank", "min": 3, "match_column": "user_id", "extra_filter": {"field": "source", "not_equals": "ai_generated"}}}, {"default": true, "rule": {"type": "min_count", "table": "accomplishment_bank", "min": 3, "match_column": "user_id"}}]}'
),

-- Step 5: CAR Stories (critical)
('b0000000-0000-0000-0000-000000000001',
 'car_stories',
 'CAR Stories',
 'Create Challenge-Action-Result stories — a critical step for interview-magnet resumes',
 5,
 '/dashboard/resume-builder/car-story',
 false, NULL, true, false, '{accomplishment_bank}',
 '{"type": "min_count", "table": "par_stories", "min": 3, "match_column": "user_id", "extra_filter": {"field": "status", "equals": "completed"}}'
),

-- Step 6: Professional Positioning
('b0000000-0000-0000-0000-000000000001',
 'professional_positioning',
 'Professional Positioning',
 'Define your professional identity and positioning',
 6,
 '/dashboard/resume-builder/positioning-questionnaire',
 false, NULL, true, false, '{car_stories}',
 '{"type": "table_check", "table": "positioning_questionnaire", "required_fields": ["identity_current_title", "identity_target_title", "identity_one_phrase", "industries", "strengths"], "match_column": "user_id"}'
),

-- Step 7: Path Complete (terminal)
('b0000000-0000-0000-0000-000000000001',
 'guided_path_complete',
 'Path Complete',
 'Congratulations! Your professional foundation is ready.',
 7,
 '/dashboard/resume-builder/final-preview',
 false, NULL, false, true, '{professional_positioning}',
 '{"type": "always_complete"}'
);

-- ============================================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================================

-- Path definitions: public read (template data)
ALTER TABLE guided_path_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read path definitions"
  ON guided_path_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Path versions: public read
ALTER TABLE guided_path_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read path versions"
  ON guided_path_versions FOR SELECT
  TO authenticated
  USING (true);

-- Step definitions: public read
ALTER TABLE guided_step_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read step definitions"
  ON guided_step_definitions FOR SELECT
  TO authenticated
  USING (true);

-- Path runs: user-scoped
ALTER TABLE guided_path_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own path runs"
  ON guided_path_runs FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own path runs"
  ON guided_path_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own path runs"
  ON guided_path_runs FOR UPDATE
  USING (auth.uid() = user_id);

-- Step states: user-scoped
ALTER TABLE guided_step_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own step states"
  ON guided_step_states FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own step states"
  ON guided_step_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own step states"
  ON guided_step_states FOR UPDATE
  USING (auth.uid() = user_id);

-- Step transitions: user-scoped read
ALTER TABLE guided_step_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own step transitions"
  ON guided_step_transitions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own step transitions"
  ON guided_step_transitions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Events: user-scoped read, insert
ALTER TABLE guided_path_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own events"
  ON guided_path_events FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events"
  ON guided_path_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 10. ADMIN / COACH ACCESS POLICIES
-- ============================================================================

-- Coaches can view their clients' path runs
CREATE POLICY "Coaches can view client path runs"
  ON guided_path_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = guided_path_runs.user_id
        AND coach_clients.status = 'active'
    )
  );

-- Coaches can view their clients' step states
CREATE POLICY "Coaches can view client step states"
  ON guided_step_states FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = guided_step_states.user_id
        AND coach_clients.status = 'active'
    )
  );

-- Coaches can view their clients' events
CREATE POLICY "Coaches can view client events"
  ON guided_path_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = auth.uid()
        AND coach_clients.client_id = guided_path_events.user_id
        AND coach_clients.status = 'active'
    )
  );

-- ============================================================================
-- 11. UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_guided_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_path_runs_updated
  BEFORE UPDATE ON guided_path_runs
  FOR EACH ROW EXECUTE FUNCTION update_guided_updated_at();

CREATE TRIGGER trg_step_states_updated
  BEFORE UPDATE ON guided_step_states
  FOR EACH ROW EXECUTE FUNCTION update_guided_updated_at();

-- ============================================================================
-- 12. RPC: GET FULL GUIDED PATH STATE
-- ============================================================================

CREATE OR REPLACE FUNCTION get_guided_path_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  v_run RECORD;
BEGIN
  -- Get the active run for this user
  SELECT * INTO v_run
  FROM guided_path_runs
  WHERE user_id = p_user_id
    AND status IN ('not_started', 'in_progress', 'paused')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_run IS NULL THEN
    RETURN jsonb_build_object(
      'has_active_run', false,
      'run', NULL,
      'steps', '[]'::jsonb
    );
  END IF;

  SELECT jsonb_build_object(
    'has_active_run', true,
    'run', jsonb_build_object(
      'id', v_run.id,
      'status', v_run.status,
      'guidance_enabled', v_run.guidance_enabled,
      'input_method', v_run.input_method,
      'last_completed_step_key', v_run.last_completed_step_key,
      'current_recommended_step_key', v_run.current_recommended_step_key,
      'current_actual_step_key', v_run.current_actual_step_key,
      'started_at', v_run.started_at,
      'paused_at', v_run.paused_at,
      'resumed_at', v_run.resumed_at,
      'completed_at', v_run.completed_at,
      'metadata', v_run.metadata
    ),
    'steps', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'step_key', sd.step_key,
          'display_name', sd.display_name,
          'step_order', sd.step_order,
          'route_path', sd.route_path,
          'is_branching_point', sd.is_branching_point,
          'branch_options', sd.branch_options,
          'is_required', sd.is_required,
          'is_terminal', sd.is_terminal,
          'depends_on_steps', sd.depends_on_steps,
          'state', COALESCE(
            jsonb_build_object(
              'status', ss.status,
              'completion_pct', ss.completion_pct,
              'first_viewed_at', ss.first_viewed_at,
              'started_at', ss.started_at,
              'completed_at', ss.completed_at,
              'skipped_at', ss.skipped_at,
              'view_count', ss.view_count,
              'save_count', ss.save_count
            ),
            jsonb_build_object(
              'status', 'not_started',
              'completion_pct', 0,
              'view_count', 0,
              'save_count', 0
            )
          )
        ) ORDER BY sd.step_order
      )
      FROM guided_step_definitions sd
      LEFT JOIN guided_step_states ss
        ON ss.step_definition_id = sd.id AND ss.run_id = v_run.id
      WHERE sd.path_version_id = v_run.path_version_id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

-- ============================================================================
-- 13. RPC: LOG GUIDED PATH EVENT
-- ============================================================================

CREATE OR REPLACE FUNCTION log_guided_event(
  p_user_id UUID,
  p_event_type guided_event_type,
  p_session_id TEXT DEFAULT NULL,
  p_run_id UUID DEFAULT NULL,
  p_step_key TEXT DEFAULT NULL,
  p_step_name TEXT DEFAULT NULL,
  p_source_page TEXT DEFAULT NULL,
  p_target_page TEXT DEFAULT NULL,
  p_completion_status TEXT DEFAULT NULL,
  p_input_method guided_input_method DEFAULT NULL,
  p_triggered_by guided_trigger_source DEFAULT 'user_action',
  p_duration_ms INTEGER DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
  v_path_version_id UUID;
BEGIN
  -- Get path version from run if available
  IF p_run_id IS NOT NULL THEN
    SELECT path_version_id INTO v_path_version_id
    FROM guided_path_runs WHERE id = p_run_id;
  END IF;

  INSERT INTO guided_path_events (
    user_id, session_id, run_id, event_type, path_version_id,
    step_key, step_name, source_page, target_page,
    completion_status, input_method, triggered_by,
    duration_ms, metadata
  ) VALUES (
    p_user_id, p_session_id, p_run_id, p_event_type, v_path_version_id,
    p_step_key, p_step_name, p_source_page, p_target_page,
    p_completion_status, p_input_method, p_triggered_by,
    p_duration_ms, p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

-- ============================================================================
-- 14. RPC: INITIALIZE GUIDED PATH RUN
-- ============================================================================

CREATE OR REPLACE FUNCTION initialize_guided_path(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_version_id UUID;
  v_run_id UUID;
  v_existing RECORD;
BEGIN
  -- Check for existing active run
  SELECT id, status INTO v_existing
  FROM guided_path_runs
  WHERE user_id = p_user_id
    AND status IN ('not_started', 'in_progress', 'paused')
  LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object(
      'run_id', v_existing.id,
      'status', v_existing.status,
      'already_existed', true
    );
  END IF;

  -- Get current version
  SELECT pv.id INTO v_version_id
  FROM guided_path_versions pv
  JOIN guided_path_definitions pd ON pd.id = pv.path_definition_id
  WHERE pd.path_key = 'smart_guided_path'
    AND pv.is_current = true
  LIMIT 1;

  IF v_version_id IS NULL THEN
    RAISE EXCEPTION 'No active guided path version found';
  END IF;

  -- Create the run
  INSERT INTO guided_path_runs (user_id, path_version_id, status, current_recommended_step_key, started_at)
  VALUES (p_user_id, v_version_id, 'in_progress', 'profile_basic_info', now())
  RETURNING id INTO v_run_id;

  -- Create step states for all steps
  INSERT INTO guided_step_states (run_id, step_definition_id, user_id, status)
  SELECT v_run_id, sd.id, p_user_id,
    CASE
      WHEN sd.step_order = 1 THEN 'available'::guided_step_status
      ELSE 'not_started'::guided_step_status
    END
  FROM guided_step_definitions sd
  WHERE sd.path_version_id = v_version_id
  ORDER BY sd.step_order;

  -- Log the event
  PERFORM log_guided_event(
    p_user_id, 'guided_path_started',
    NULL, v_run_id,
    'profile_basic_info', 'Basic Profile & Contact Info',
    NULL, NULL, NULL, NULL, 'system', NULL,
    jsonb_build_object('version_id', v_version_id)
  );

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'status', 'in_progress',
    'already_existed', false,
    'first_step', 'profile_basic_info'
  );
END;
$$;

-- ============================================================================
-- 15. ANALYTICS VIEWS
-- ============================================================================

-- Funnel analysis view
CREATE OR REPLACE VIEW guided_path_funnel AS
SELECT
  pv.version_label,
  sd.step_key,
  sd.step_order,
  sd.display_name,
  COUNT(DISTINCT ss.user_id) AS users_reached,
  COUNT(DISTINCT ss.user_id) FILTER (WHERE ss.status = 'completed') AS users_completed,
  COUNT(DISTINCT ss.user_id) FILTER (WHERE ss.status = 'skipped') AS users_skipped,
  COUNT(DISTINCT ss.user_id) FILTER (WHERE ss.status = 'in_progress') AS users_in_progress,
  ROUND(
    COUNT(DISTINCT ss.user_id) FILTER (WHERE ss.status = 'completed')::NUMERIC /
    NULLIF(COUNT(DISTINCT ss.user_id), 0) * 100, 1
  ) AS completion_rate_pct
FROM guided_step_definitions sd
JOIN guided_path_versions pv ON pv.id = sd.path_version_id
LEFT JOIN guided_step_states ss ON ss.step_definition_id = sd.id
GROUP BY pv.version_label, sd.step_key, sd.step_order, sd.display_name
ORDER BY sd.step_order;

-- Drop-off analysis view
CREATE OR REPLACE VIEW guided_path_dropoffs AS
SELECT
  gpr.path_version_id,
  pv.version_label,
  gpr.last_completed_step_key AS dropoff_step,
  gpr.input_method,
  COUNT(*) AS users_dropped,
  AVG(EXTRACT(EPOCH FROM (COALESCE(gpr.abandoned_at, gpr.updated_at) - gpr.started_at))) AS avg_seconds_before_drop
FROM guided_path_runs gpr
JOIN guided_path_versions pv ON pv.id = gpr.path_version_id
WHERE gpr.status IN ('paused', 'abandoned')
GROUP BY gpr.path_version_id, pv.version_label, gpr.last_completed_step_key, gpr.input_method;

-- Step timing analysis
CREATE OR REPLACE VIEW guided_step_timing AS
SELECT
  e.step_key,
  e.event_type,
  COUNT(*) AS event_count,
  AVG(e.duration_ms) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY e.duration_ms) AS median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY e.duration_ms) AS p95_duration_ms,
  MIN(e.duration_ms) AS min_duration_ms,
  MAX(e.duration_ms) AS max_duration_ms
FROM guided_path_events e
WHERE e.duration_ms IS NOT NULL
GROUP BY e.step_key, e.event_type;
