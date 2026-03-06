-- ============================================================================
-- NovaWork — Coaching Platform Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: March 5, 2026
-- Description: 11 coaching tables + is_coach column + indexes + RLS policies
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 0: Add is_coach column to users table
-- ============================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_coach BOOLEAN DEFAULT FALSE;
COMMENT ON COLUMN users.is_coach IS 'TRUE if user has coach privileges';

-- Helper function to promote a user to coach by email
CREATE OR REPLACE FUNCTION promote_to_coach(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE users SET is_coach = TRUE WHERE email = user_email;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN
    RETURN 'ERROR: No user found with email ' || user_email;
  END IF;
  RETURN 'SUCCESS: ' || user_email || ' is now a coach';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to demote a coach
CREATE OR REPLACE FUNCTION demote_coach(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  affected_rows INTEGER;
BEGIN
  UPDATE users SET is_coach = FALSE WHERE email = user_email;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows = 0 THEN
    RETURN 'ERROR: No user found with email ' || user_email;
  END IF;
  RETURN 'SUCCESS: ' || user_email || ' is no longer a coach';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TABLE 1: coach_profiles
-- Coach's professional profile, specialties, and capacity
-- ============================================================================

CREATE TABLE coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Professional info
  bio TEXT,
  specialties TEXT[],                    -- e.g., ['career_transition', 'executive', 'tech', 'negotiation']
  certifications TEXT[],                 -- e.g., ['ICF-PCC', 'SHRM-CP']
  years_coaching_experience INTEGER,
  
  -- Availability & capacity
  max_clients INTEGER DEFAULT 20,
  current_client_count INTEGER DEFAULT 0,
  is_accepting_clients BOOLEAN DEFAULT TRUE,
  timezone TEXT DEFAULT 'America/New_York',
  
  -- Contact preferences
  preferred_session_duration INTEGER DEFAULT 60,  -- minutes
  available_days TEXT[],                          -- e.g., ['monday', 'tuesday', 'wednesday']
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coach_profiles IS 'Coach professional profile, specialties, availability, and client capacity';

-- ============================================================================
-- TABLE 2: coach_clients
-- Relationship between coach and client (assignment)
-- ============================================================================

CREATE TABLE coach_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Relationship status
  status TEXT DEFAULT 'active',          -- active, paused, completed, cancelled
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  -- Program info
  program_type TEXT,                     -- novanext, novarearchitect, novaalign, custom
  sessions_planned INTEGER,              -- total sessions in the engagement
  sessions_completed INTEGER DEFAULT 0,
  
  -- Notes
  engagement_notes TEXT,                 -- why this client was assigned
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(coach_id, client_id)
);

COMMENT ON TABLE coach_clients IS 'Coach-client assignment relationship with engagement tracking';

-- ============================================================================
-- TABLE 3: coaching_sessions
-- Scheduled coaching sessions with pre/during/post notes
-- ============================================================================

CREATE TABLE coaching_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Session scheduling
  session_number INTEGER,                -- e.g., session 3 of 12
  session_type TEXT DEFAULT 'regular',   -- onboarding, regular, career_vision, resume_strategy, interview_prep, negotiation, check_in, closing
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',       -- scheduled, in_progress, completed, cancelled, no_show
  
  -- Pre-session (client fills out before)
  pre_session_wins TEXT,                 -- what went well since last session
  pre_session_challenges TEXT,           -- obstacles encountered
  pre_session_priorities TEXT,           -- what they want to focus on
  
  -- During session (coach fills out)
  session_agenda TEXT,
  session_notes TEXT,                    -- coach's notes during session
  key_insights TEXT,                     -- main takeaways
  
  -- Post-session
  session_summary TEXT,                  -- AI-generated or coach-written summary
  client_satisfaction INTEGER CHECK (client_satisfaction BETWEEN 1 AND 5),
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coaching_sessions IS 'Structured coaching sessions with pre/during/post workflow';

-- ============================================================================
-- TABLE 4: session_commitments
-- Action items / commitments from each session
-- ============================================================================

CREATE TABLE session_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES coaching_sessions(id) ON DELETE CASCADE NOT NULL,
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Commitment details
  description TEXT NOT NULL,
  due_date DATE,
  priority TEXT DEFAULT 'medium',        -- high, medium, low
  status TEXT DEFAULT 'pending',         -- pending, in_progress, completed, overdue, cancelled
  
  -- Tracking
  completed_at TIMESTAMPTZ,
  coach_feedback TEXT,                   -- coach response when completed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE session_commitments IS 'Action items and commitments from coaching sessions';

-- ============================================================================
-- TABLE 5: coaching_goals
-- SMART goals set collaboratively by coach and client
-- ============================================================================

CREATE TABLE coaching_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Goal definition (SMART)
  title TEXT NOT NULL,                   -- e.g., "Land 3 interviews in 2 weeks"
  description TEXT,
  category TEXT,                         -- resume, networking, applications, interview, negotiation, mindset, skill_development
  target_metric TEXT,                    -- e.g., "3 interviews"
  target_value INTEGER,                  -- e.g., 3
  current_value INTEGER DEFAULT 0,
  
  -- Timeline
  start_date DATE,
  target_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active',          -- active, completed, paused, abandoned
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coaching_goals IS 'SMART goals set collaboratively between coach and client';

-- ============================================================================
-- TABLE 6: coaching_notes
-- Private coach notes per client (client CANNOT see these)
-- ============================================================================

CREATE TABLE coaching_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Note content
  title TEXT,
  content TEXT NOT NULL,
  note_type TEXT DEFAULT 'general',      -- general, observation, concern, strategy, follow_up
  is_flagged BOOLEAN DEFAULT FALSE,      -- important/alert note
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coaching_notes IS 'Private coach-only notes about clients. Clients cannot see these.';

-- ============================================================================
-- TABLE 7: client_pipeline
-- Kanban pipeline of client job opportunities
-- ============================================================================

CREATE TABLE client_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Opportunity details
  company_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_url TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  location TEXT,
  remote_type TEXT,                      -- remote, hybrid, on_site
  
  -- Pipeline stage
  stage TEXT DEFAULT 'researching',      -- researching, networking, applied, screening, interview_1, interview_2, interview_final, offer, negotiating, accepted, rejected
  
  -- Tracking
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  contact_name TEXT,                     -- key contact at the company
  contact_linkedin TEXT,
  next_step TEXT,                        -- what to do next
  next_step_date DATE,
  
  -- Coach input
  coach_notes TEXT,
  
  -- Dates
  applied_at TIMESTAMPTZ,
  interview_date TIMESTAMPTZ,
  offer_date TIMESTAMPTZ,
  decision_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_pipeline IS 'Kanban pipeline tracking client job opportunities from research to offer';

-- ============================================================================
-- TABLE 8: coaching_messages
-- In-app messaging between coach and client
-- ============================================================================

CREATE TABLE coaching_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Message content
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',      -- text, task, resource, celebration
  
  -- Attachments (optional)
  attachment_url TEXT,
  attachment_type TEXT,                  -- pdf, image, link
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coaching_messages IS 'In-app messaging between coach and client';

-- ============================================================================
-- TABLE 9: client_wellbeing_checkins
-- Weekly emotional/motivation check-ins
-- ============================================================================

CREATE TABLE client_wellbeing_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE,
  
  -- Check-in data
  checkin_date DATE DEFAULT CURRENT_DATE,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 10),
  motivation_level INTEGER CHECK (motivation_level BETWEEN 1 AND 10),
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 10),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 10),
  overall_mood INTEGER CHECK (overall_mood BETWEEN 1 AND 10),
  
  -- Context
  highlight_of_week TEXT,                -- best thing that happened
  biggest_challenge TEXT,                -- main struggle
  additional_notes TEXT,
  
  -- Coach response
  coach_response TEXT,
  coach_responded_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_wellbeing_checkins IS 'Weekly emotional and motivation check-ins from clients';

-- ============================================================================
-- TABLE 10: coaching_resources
-- Resource library managed by coaches
-- ============================================================================

CREATE TABLE coaching_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Resource details
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,                         -- mindset, networking, linkedin, negotiation, resume, interview, stress_management, personal_brand, elevator_pitch
  resource_type TEXT,                    -- pdf, video, article, template, worksheet, link
  resource_url TEXT,                     -- URL or storage path
  
  -- Metadata
  is_public BOOLEAN DEFAULT FALSE,       -- visible to all coaches or just creator
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE coaching_resources IS 'Coach resource library: PDFs, videos, templates, articles';

-- ============================================================================
-- TABLE 11: resource_assignments
-- Resources assigned to specific clients
-- ============================================================================

CREATE TABLE resource_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID REFERENCES coaching_resources(id) ON DELETE CASCADE NOT NULL,
  coach_client_id UUID REFERENCES coach_clients(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  -- Assignment details
  assigned_by UUID REFERENCES users(id) NOT NULL,  -- coach who assigned it
  assigned_note TEXT,                               -- why this resource was assigned
  
  -- Client tracking
  is_viewed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  client_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE resource_assignments IS 'Resources assigned by coaches to specific clients';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Coach profiles
CREATE INDEX idx_coach_profiles_user_id ON coach_profiles(user_id);

-- Coach clients
CREATE INDEX idx_coach_clients_coach_id ON coach_clients(coach_id);
CREATE INDEX idx_coach_clients_client_id ON coach_clients(client_id);
CREATE INDEX idx_coach_clients_status ON coach_clients(status);

-- Coaching sessions
CREATE INDEX idx_coaching_sessions_coach_client_id ON coaching_sessions(coach_client_id);
CREATE INDEX idx_coaching_sessions_coach_id ON coaching_sessions(coach_id);
CREATE INDEX idx_coaching_sessions_client_id ON coaching_sessions(client_id);
CREATE INDEX idx_coaching_sessions_scheduled_at ON coaching_sessions(scheduled_at);
CREATE INDEX idx_coaching_sessions_status ON coaching_sessions(status);

-- Session commitments
CREATE INDEX idx_session_commitments_session_id ON session_commitments(session_id);
CREATE INDEX idx_session_commitments_client_id ON session_commitments(client_id);
CREATE INDEX idx_session_commitments_status ON session_commitments(status);
CREATE INDEX idx_session_commitments_due_date ON session_commitments(due_date);

-- Coaching goals
CREATE INDEX idx_coaching_goals_coach_client_id ON coaching_goals(coach_client_id);
CREATE INDEX idx_coaching_goals_client_id ON coaching_goals(client_id);
CREATE INDEX idx_coaching_goals_status ON coaching_goals(status);

-- Coaching notes
CREATE INDEX idx_coaching_notes_coach_client_id ON coaching_notes(coach_client_id);
CREATE INDEX idx_coaching_notes_coach_id ON coaching_notes(coach_id);

-- Client pipeline
CREATE INDEX idx_client_pipeline_client_id ON client_pipeline(client_id);
CREATE INDEX idx_client_pipeline_stage ON client_pipeline(stage);
CREATE INDEX idx_client_pipeline_coach_client_id ON client_pipeline(coach_client_id);

-- Coaching messages
CREATE INDEX idx_coaching_messages_coach_client_id ON coaching_messages(coach_client_id);
CREATE INDEX idx_coaching_messages_sender_id ON coaching_messages(sender_id);
CREATE INDEX idx_coaching_messages_recipient_id ON coaching_messages(recipient_id);
CREATE INDEX idx_coaching_messages_is_read ON coaching_messages(is_read) WHERE is_read = FALSE;
CREATE INDEX idx_coaching_messages_created_at ON coaching_messages(created_at DESC);

-- Client wellbeing check-ins
CREATE INDEX idx_wellbeing_checkins_client_id ON client_wellbeing_checkins(client_id);
CREATE INDEX idx_wellbeing_checkins_date ON client_wellbeing_checkins(checkin_date DESC);
CREATE INDEX idx_wellbeing_checkins_coach_client_id ON client_wellbeing_checkins(coach_client_id);

-- Coaching resources
CREATE INDEX idx_coaching_resources_coach_id ON coaching_resources(coach_id);
CREATE INDEX idx_coaching_resources_category ON coaching_resources(category);

-- Resource assignments
CREATE INDEX idx_resource_assignments_client_id ON resource_assignments(client_id);
CREATE INDEX idx_resource_assignments_resource_id ON resource_assignments(resource_id);
CREATE INDEX idx_resource_assignments_coach_client_id ON resource_assignments(coach_client_id);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all coaching tables
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_wellbeing_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaching_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_assignments ENABLE ROW LEVEL SECURITY;

-- ── coach_profiles ──────────────────────────────────────────────

-- Coaches can view/edit their own profile
CREATE POLICY "Coaches can view own profile"
  ON coach_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Coaches can insert own profile"
  ON coach_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches can update own profile"
  ON coach_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Clients can view their assigned coach's profile
CREATE POLICY "Clients can view assigned coach profile"
  ON coach_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.coach_id = coach_profiles.user_id
        AND coach_clients.client_id = auth.uid()
        AND coach_clients.status = 'active'
    )
  );

-- ── coach_clients ───────────────────────────────────────────────

-- Coaches can see their client list
CREATE POLICY "Coaches can view own clients"
  ON coach_clients FOR SELECT
  USING (auth.uid() = coach_id);

-- Coaches can manage client assignments
CREATE POLICY "Coaches can insert clients"
  ON coach_clients FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update client status"
  ON coach_clients FOR UPDATE
  USING (auth.uid() = coach_id);

-- Clients can see their own coach assignment
CREATE POLICY "Clients can view own assignment"
  ON coach_clients FOR SELECT
  USING (auth.uid() = client_id);

-- ── coaching_sessions ───────────────────────────────────────────

-- Coaches can CRUD sessions for their clients
CREATE POLICY "Coaches can view sessions"
  ON coaching_sessions FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create sessions"
  ON coaching_sessions FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update sessions"
  ON coaching_sessions FOR UPDATE
  USING (auth.uid() = coach_id);

-- Clients can view and update their own sessions (pre-session notes)
CREATE POLICY "Clients can view own sessions"
  ON coaching_sessions FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update pre-session fields"
  ON coaching_sessions FOR UPDATE
  USING (auth.uid() = client_id);

-- ── session_commitments ─────────────────────────────────────────

-- Coaches can manage commitments
CREATE POLICY "Coaches can view commitments"
  ON session_commitments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = session_commitments.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can create commitments"
  ON session_commitments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = session_commitments.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update commitments"
  ON session_commitments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = session_commitments.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

-- Clients can view and update their own commitments
CREATE POLICY "Clients can view own commitments"
  ON session_commitments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update own commitment status"
  ON session_commitments FOR UPDATE
  USING (auth.uid() = client_id);

-- ── coaching_goals ──────────────────────────────────────────────

-- Coaches can manage goals
CREATE POLICY "Coaches can view goals"
  ON coaching_goals FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create goals"
  ON coaching_goals FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update goals"
  ON coaching_goals FOR UPDATE
  USING (auth.uid() = coach_id);

-- Clients can view and update their own goals
CREATE POLICY "Clients can view own goals"
  ON coaching_goals FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update own goal progress"
  ON coaching_goals FOR UPDATE
  USING (auth.uid() = client_id);

-- ── coaching_notes (COACH-ONLY — clients cannot see) ────────────

CREATE POLICY "Coaches can view own notes"
  ON coaching_notes FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create notes"
  ON coaching_notes FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update notes"
  ON coaching_notes FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete notes"
  ON coaching_notes FOR DELETE
  USING (auth.uid() = coach_id);

-- NO client policies — clients cannot see coaching_notes

-- ── client_pipeline ─────────────────────────────────────────────

-- Clients can manage their own pipeline
CREATE POLICY "Clients can view own pipeline"
  ON client_pipeline FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create pipeline entries"
  ON client_pipeline FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own pipeline"
  ON client_pipeline FOR UPDATE
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can delete own pipeline entries"
  ON client_pipeline FOR DELETE
  USING (auth.uid() = client_id);

-- Coaches can view & update their clients' pipeline
CREATE POLICY "Coaches can view client pipeline"
  ON client_pipeline FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = client_pipeline.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can update client pipeline"
  ON client_pipeline FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = client_pipeline.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

-- ── coaching_messages ───────────────────────────────────────────

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON coaching_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON coaching_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Recipients can mark messages as read
CREATE POLICY "Recipients can update message read status"
  ON coaching_messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- ── client_wellbeing_checkins ───────────────────────────────────

-- Clients can manage their own check-ins
CREATE POLICY "Clients can view own checkins"
  ON client_wellbeing_checkins FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can create checkins"
  ON client_wellbeing_checkins FOR INSERT
  WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Clients can update own checkins"
  ON client_wellbeing_checkins FOR UPDATE
  USING (auth.uid() = client_id);

-- Coaches can view and respond to client check-ins
CREATE POLICY "Coaches can view client checkins"
  ON client_wellbeing_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = client_wellbeing_checkins.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

CREATE POLICY "Coaches can respond to checkins"
  ON client_wellbeing_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.id = client_wellbeing_checkins.coach_client_id
        AND coach_clients.coach_id = auth.uid()
    )
  );

-- ── coaching_resources ──────────────────────────────────────────

-- Coaches can manage their own resources
CREATE POLICY "Coaches can view own resources"
  ON coaching_resources FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can create resources"
  ON coaching_resources FOR INSERT
  WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Coaches can update own resources"
  ON coaching_resources FOR UPDATE
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can delete own resources"
  ON coaching_resources FOR DELETE
  USING (auth.uid() = coach_id);

-- Coaches can view public resources from other coaches
CREATE POLICY "Coaches can view public resources"
  ON coaching_resources FOR SELECT
  USING (
    is_public = TRUE
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_coach = TRUE)
  );

-- ── resource_assignments ────────────────────────────────────────

-- Coaches can manage resource assignments
CREATE POLICY "Coaches can view resource assignments"
  ON resource_assignments FOR SELECT
  USING (auth.uid() = assigned_by);

CREATE POLICY "Coaches can create resource assignments"
  ON resource_assignments FOR INSERT
  WITH CHECK (auth.uid() = assigned_by);

-- Clients can view and update their assigned resources
CREATE POLICY "Clients can view assigned resources"
  ON resource_assignments FOR SELECT
  USING (auth.uid() = client_id);

CREATE POLICY "Clients can update assigned resource status"
  ON resource_assignments FOR UPDATE
  USING (auth.uid() = client_id);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================

CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coach_clients_updated_at
  BEFORE UPDATE ON coach_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_sessions_updated_at
  BEFORE UPDATE ON coaching_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_commitments_updated_at
  BEFORE UPDATE ON session_commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_goals_updated_at
  BEFORE UPDATE ON coaching_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_notes_updated_at
  BEFORE UPDATE ON coaching_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_pipeline_updated_at
  BEFORE UPDATE ON client_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaching_resources_updated_at
  BEFORE UPDATE ON coaching_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFY: List all coaching tables
-- ============================================================================

SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'coach_profiles', 'coach_clients', 'coaching_sessions',
    'session_commitments', 'coaching_goals', 'coaching_notes',
    'client_pipeline', 'coaching_messages', 'client_wellbeing_checkins',
    'coaching_resources', 'resource_assignments'
  )
ORDER BY table_name;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Promote a user to coach:
-- SELECT promote_to_coach('efrain.pradas@gmail.com');

-- Demote a coach:
-- SELECT demote_coach('efrain.pradas@gmail.com');

-- Check who is a coach:
-- SELECT id, email, full_name, is_coach FROM users WHERE is_coach = TRUE;
