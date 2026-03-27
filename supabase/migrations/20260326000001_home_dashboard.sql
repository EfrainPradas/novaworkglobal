-- ============================================================
-- NovaWork Home Dashboard Migration
-- Created: 2026-03-26
-- Purpose: Tables, RLS, RPC functions, and seed data for the
--          new /dashboard Home Dashboard (Career Command Center)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS member_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  host_name        text,
  session_type     text NOT NULL CHECK (session_type IN ('networking','workshop','q_and_a','masterclass')),
  membership_level text NOT NULL DEFAULT 'essentials' CHECK (membership_level IN ('essentials','momentum','executive')),
  topic            text CHECK (topic IN ('resume','interview','networking','career_pivot','leadership') OR topic IS NULL),
  scheduled_at     timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  capacity         int NOT NULL DEFAULT 50,
  meeting_url      text,
  status           text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','completed')),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    uuid NOT NULL REFERENCES member_sessions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'registered' CHECK (status IN ('registered','cancelled','waitlisted')),
  registered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE TABLE IF NOT EXISTS community_groups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text,
  icon             text,
  color            text,
  membership_level text NOT NULL DEFAULT 'essentials' CHECK (membership_level IN ('essentials','momentum','executive')),
  member_count     int NOT NULL DEFAULT 0,
  is_featured      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_resources (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title            text NOT NULL,
  description      text,
  resource_type    text NOT NULL CHECK (resource_type IN ('article','video','pdf','tool')),
  url              text,
  membership_level text NOT NULL DEFAULT 'essentials' CHECK (membership_level IN ('essentials','momentum','executive')),
  topic            text,
  is_featured      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dashboard_activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  description text,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_member_sessions_scheduled ON member_sessions (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_member_sessions_status    ON member_sessions (status);
CREATE INDEX IF NOT EXISTS idx_session_registrations_user ON session_registrations (user_id);
CREATE INDEX IF NOT EXISTS idx_session_registrations_session ON session_registrations (session_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_activity_user   ON dashboard_activity_log (user_id, created_at DESC);

-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ────────────────────────────────────────────────────────────

ALTER TABLE member_sessions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_registrations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_groups         ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_resources      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_activity_log   ENABLE ROW LEVEL SECURITY;

-- member_sessions: authenticated users read non-cancelled sessions
DROP POLICY IF EXISTS "users_read_sessions" ON member_sessions;
CREATE POLICY "users_read_sessions"
  ON member_sessions FOR SELECT TO authenticated
  USING (status <> 'cancelled');

-- session_registrations: users manage only their own rows
DROP POLICY IF EXISTS "users_read_own_registrations" ON session_registrations;
CREATE POLICY "users_read_own_registrations"
  ON session_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_registrations" ON session_registrations;
CREATE POLICY "users_insert_own_registrations"
  ON session_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "users_update_own_registrations" ON session_registrations;
CREATE POLICY "users_update_own_registrations"
  ON session_registrations FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- community_groups: all authenticated users read
DROP POLICY IF EXISTS "users_read_groups" ON community_groups;
CREATE POLICY "users_read_groups"
  ON community_groups FOR SELECT TO authenticated
  USING (true);

-- dashboard_resources: all authenticated users read
DROP POLICY IF EXISTS "users_read_resources" ON dashboard_resources;
CREATE POLICY "users_read_resources"
  ON dashboard_resources FOR SELECT TO authenticated
  USING (true);

-- dashboard_activity_log: users manage only their own
DROP POLICY IF EXISTS "users_read_own_activity" ON dashboard_activity_log;
CREATE POLICY "users_read_own_activity"
  ON dashboard_activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "users_insert_own_activity" ON dashboard_activity_log;
CREATE POLICY "users_insert_own_activity"
  ON dashboard_activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────
-- 4. RPC FUNCTIONS
-- ────────────────────────────────────────────────────────────

-- get_dashboard_overview
-- Aggregates all career stats for a user in a single call.
-- Falls back to 0 if referenced tables don't exist yet.
CREATE OR REPLACE FUNCTION get_dashboard_overview(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_applications     int := 0;
  v_interviews       int := 0;
  v_resumes          int := 0;
  v_resume_downloads int := 0;
  v_sessions_joined  int := 0;
  v_par_count        int := 0;
  v_work_exp_count   int := 0;
  v_has_profile      boolean := false;
  v_profile_pct      int := 0;
BEGIN
  -- Graceful fallbacks for optional tables
  BEGIN
    SELECT COUNT(*) INTO v_applications
    FROM job_applications WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN v_applications := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_interviews
    FROM interviews WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN v_interviews := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_resumes
    FROM tailored_resumes WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN v_resumes := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_resume_downloads
    FROM tailored_resumes WHERE user_id = p_user_id AND status = 'downloaded';
  EXCEPTION WHEN undefined_table THEN v_resume_downloads := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_sessions_joined
    FROM session_registrations WHERE user_id = p_user_id AND status = 'registered';
  EXCEPTION WHEN undefined_table THEN v_sessions_joined := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_par_count
    FROM par_stories WHERE user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN v_par_count := 0; END;

  BEGIN
    SELECT COUNT(*) INTO v_work_exp_count
    FROM work_experience we
    JOIN user_resumes ur ON ur.id = we.resume_id
    WHERE ur.user_id = p_user_id;
  EXCEPTION WHEN undefined_table THEN v_work_exp_count := 0; END;

  BEGIN
    SELECT (profile_summary IS NOT NULL AND profile_summary <> '')
    INTO v_has_profile
    FROM user_resumes WHERE user_id = p_user_id
    ORDER BY created_at DESC LIMIT 1;
  EXCEPTION WHEN undefined_table THEN v_has_profile := false; END;

  v_profile_pct := LEAST(100,
    (CASE WHEN v_has_profile    THEN 25 ELSE 0 END) +
    LEAST(25, v_work_exp_count * 8) +
    LEAST(25, v_par_count * 5) +
    (CASE WHEN v_resumes > 0   THEN 25 ELSE 0 END)
  );

  RETURN jsonb_build_object(
    'applications_count',       v_applications,
    'interviews_count',         v_interviews,
    'resume_versions_count',    v_resumes,
    'resume_downloads_count',   v_resume_downloads,
    'sessions_joined_count',    v_sessions_joined,
    'profile_completion_percent', v_profile_pct
  );
END;
$$;

-- register_for_member_session
CREATE OR REPLACE FUNCTION register_for_member_session(p_user_id uuid, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session      member_sessions%ROWTYPE;
  v_active_count int;
  v_seats_left   int;
BEGIN
  SELECT * INTO v_session FROM member_sessions WHERE id = p_session_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_not_found');
  END IF;

  IF v_session.status IN ('cancelled', 'completed') THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_unavailable');
  END IF;

  IF EXISTS (
    SELECT 1 FROM session_registrations
    WHERE session_id = p_session_id AND user_id = p_user_id AND status = 'registered'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_registered');
  END IF;

  SELECT COUNT(*) INTO v_active_count
  FROM session_registrations
  WHERE session_id = p_session_id AND status = 'registered';

  v_seats_left := v_session.capacity - v_active_count;

  IF v_seats_left <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'session_full', 'seats_left', 0);
  END IF;

  INSERT INTO session_registrations (session_id, user_id, status)
  VALUES (p_session_id, p_user_id, 'registered')
  ON CONFLICT (session_id, user_id) DO UPDATE SET status = 'registered', registered_at = now();

  RETURN jsonb_build_object('success', true, 'seats_left', v_seats_left - 1);
END;
$$;

-- cancel_member_session_registration
CREATE OR REPLACE FUNCTION cancel_member_session_registration(p_user_id uuid, p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rows_affected int;
BEGIN
  UPDATE session_registrations
  SET status = 'cancelled'
  WHERE session_id = p_session_id AND user_id = p_user_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'registration_not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- get_upcoming_member_sessions (with user registration state and seats_left)
CREATE OR REPLACE FUNCTION get_upcoming_member_sessions(
  p_user_id     uuid,
  p_level       text DEFAULT NULL,
  p_topic       text DEFAULT NULL,
  p_limit       int  DEFAULT 10
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(q))
  INTO v_result
  FROM (
    SELECT
      s.*,
      s.capacity - COALESCE(
        (SELECT COUNT(*) FROM session_registrations r
         WHERE r.session_id = s.id AND r.status = 'registered'), 0
      ) AS seats_left,
      (SELECT sr.status FROM session_registrations sr
       WHERE sr.session_id = s.id AND sr.user_id = p_user_id
       LIMIT 1) AS user_registration
    FROM member_sessions s
    WHERE s.status = 'active'
      AND s.scheduled_at > now()
      AND (p_level IS NULL OR s.membership_level = p_level)
      AND (p_topic IS NULL OR s.topic = p_topic)
    ORDER BY s.scheduled_at ASC
    LIMIT p_limit
  ) q;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- 5. SEED DATA
-- ────────────────────────────────────────────────────────────

-- Member Sessions (5)
INSERT INTO member_sessions (title, description, host_name, session_type, membership_level, topic, scheduled_at, duration_minutes, capacity, meeting_url, status)
VALUES
  (
    'Resume Strategy Workshop',
    'A hands-on workshop to build a results-driven resume that gets past ATS and lands interviews. Bring your current resume for live feedback.',
    'NovaWork Career Team',
    'workshop',
    'essentials',
    'resume',
    now() + interval '6 days',
    75,
    45,
    'https://meet.novaworkglobal.com/resume-workshop',
    'active'
  ),
  (
    'Interview Mastery Q&A',
    'Live Q&A session on behavioral and competency-based interview techniques. Submit your questions in advance for priority answers.',
    'NovaWork Career Team',
    'q_and_a',
    'essentials',
    'interview',
    now() + interval '8 days',
    60,
    30,
    'https://meet.novaworkglobal.com/interview-qa',
    'active'
  ),
  (
    'LinkedIn Networking Masterclass',
    'Learn how to build a high-impact LinkedIn presence, craft connection messages that get replies, and access the hidden job market.',
    'NovaWork Career Team',
    'masterclass',
    'essentials',
    'networking',
    now() + interval '12 days',
    90,
    50,
    'https://meet.novaworkglobal.com/linkedin-masterclass',
    'active'
  ),
  (
    'Career Pivot Roundtable',
    'Open conversation for professionals navigating industry or function transitions. Share strategies, get peer support, and hear real pivot stories.',
    'NovaWork Career Team',
    'networking',
    'momentum',
    'career_pivot',
    now() + interval '14 days',
    60,
    25,
    'https://meet.novaworkglobal.com/career-pivot',
    'active'
  ),
  (
    'Executive Leadership Transition',
    'Exclusive session for executive-level professionals exploring senior leadership, board roles, or consulting careers. Private cohort format.',
    'NovaWork Executive Coach',
    'masterclass',
    'executive',
    'leadership',
    now() + interval '16 days',
    90,
    20,
    'https://meet.novaworkglobal.com/exec-transition',
    'active'
  )
ON CONFLICT DO NOTHING;

-- Community Groups (4)
INSERT INTO community_groups (name, description, icon, color, membership_level, member_count, is_featured)
VALUES
  (
    'Resume Strategy Circle',
    'A peer community to share resume feedback, templates, and ATS tips. Weekly challenges and expert drop-ins.',
    'FileText',
    '#1565C0',
    'essentials',
    128,
    true
  ),
  (
    'Interview Prep Collective',
    'Practice sessions, mock interviews, and curated question banks. All experience levels welcome.',
    'Users',
    '#6A1B9A',
    'essentials',
    94,
    false
  ),
  (
    'Networking Pros',
    'Master the art of professional networking — LinkedIn outreach, warm introductions, and the hidden job market.',
    'Network',
    '#1B5E20',
    'momentum',
    67,
    false
  ),
  (
    'Data & Analytics Careers',
    'For data professionals navigating analyst, data science, and BI roles. Job leads, portfolio reviews, and industry news.',
    'BarChart2',
    '#E65100',
    'essentials',
    83,
    true
  )
ON CONFLICT DO NOTHING;

-- Dashboard Resources (6)
INSERT INTO dashboard_resources (title, description, resource_type, url, membership_level, topic, is_featured)
VALUES
  (
    'The Resume Blueprint',
    'Step-by-step guide to building a chronological resume that passes ATS and impresses hiring managers.',
    'pdf',
    '/The_Resume_Blueprint.pdf',
    'essentials',
    'resume',
    true
  ),
  (
    'Interview Answer Framework',
    'Master the CAR (Challenge–Action–Result) method with 20 annotated example answers.',
    'video',
    '/videos/Your_Interview_Playbook-EN.mp4',
    'essentials',
    'interview',
    true
  ),
  (
    'LinkedIn Profile Optimization Guide',
    'Seven-point checklist to transform your LinkedIn profile into an inbound recruiting magnet.',
    'article',
    null,
    'essentials',
    'networking',
    false
  ),
  (
    'Career Pivot Planning Guide',
    'A structured 90-day plan for professionals making a bold industry or function change.',
    'pdf',
    null,
    'momentum',
    'career_pivot',
    false
  ),
  (
    'Salary Negotiation Playbook',
    'Scripts, anchoring strategies, and counter-offer tactics to maximize your total compensation.',
    'article',
    null,
    'momentum',
    'resume',
    false
  ),
  (
    'AI Tools for Job Search',
    'Curated toolkit of AI-powered job search assistants, resume scanners, and cover letter generators.',
    'tool',
    null,
    'essentials',
    'resume',
    true
  )
ON CONFLICT DO NOTHING;
