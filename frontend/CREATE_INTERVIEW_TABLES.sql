-- ============================================
-- Interview Mastery System™ - Database Schema
-- STEP 3: Interview Preparation & Strategy
-- CareerTipsAI 2025
-- ============================================
-- Based on Career Coach Connection 2022 Materials
-- Includes: Before, During, After Interview phases
-- Question Bank: Skills, Interests, Values, Competency-Based
-- ============================================

-- ============================================
-- 1. INTERVIEW PREPARATIONS (Main Table)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Company & Role
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  job_description TEXT,
  jd_url TEXT,

  -- Interview Details
  interview_date TIMESTAMPTZ,
  interview_location TEXT, -- 'Virtual', 'In-person: Address', etc.

  -- Interview Type Classification
  interview_type_who TEXT, -- 'HR/Recruiter', 'Hiring Manager', 'Panel'
  interview_type_how TEXT, -- 'In-person', 'Virtual', 'AI'
  interview_type_when TEXT, -- 'Screening', 'Mid-process', 'Final'
  interview_type_how_many TEXT, -- 'Individual', 'Panel', 'Group'

  -- Status
  status TEXT DEFAULT 'preparing', -- 'preparing', 'scheduled', 'completed', 'cancelled'

  -- Progress Tracking (3 Phases)
  phase1_completed BOOLEAN DEFAULT FALSE, -- Before (Prepare)
  phase2_completed BOOLEAN DEFAULT FALSE, -- During (Execution)
  phase3_completed BOOLEAN DEFAULT FALSE, -- After (Follow-up)

  -- Oral Introduction (Positioning Statement)
  oral_introduction TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. INTERVIEW RESEARCH (Phase 1: Before)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Interviewer Info (Research Your Interviewer)
  interviewer_name TEXT,
  interviewer_role TEXT,
  interviewer_linkedin_url TEXT,
  common_connections TEXT,
  interviewer_notes TEXT,

  -- Company Research (Research Industry & Company)
  company_news TEXT,
  company_financials TEXT,
  company_culture TEXT,
  industry_trends TEXT,
  competitors_analyzed TEXT[],

  -- General Research Notes
  research_notes TEXT,
  research_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. JOB DESCRIPTION COMPARISON (Phase 1: Before)
-- ============================================
CREATE TABLE IF NOT EXISTS jd_comparison_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Requirement from Job Description
  responsibility TEXT NOT NULL,

  -- My Experience (PAR story reference)
  my_experience_par_id UUID REFERENCES par_stories(id) ON DELETE SET NULL,
  my_experience_text TEXT, -- If not linked to PAR story

  -- Gap Analysis
  match_level TEXT, -- 'perfect', 'good', 'partial', 'gap'
  gap_notes TEXT,
  how_to_address TEXT, -- Strategy to address gaps

  order_index INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. INTERVIEW QUESTIONS BANK (Global Library)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Question Details
  question_text TEXT NOT NULL,
  question_category TEXT NOT NULL, -- 'skills', 'interests', 'values', 'competency'
  question_subcategory TEXT, -- 'leadership', 'teamwork', 'communication', etc.

  -- Source & Context
  source TEXT DEFAULT 'general', -- 'general', 'amazon', 'amex', 'difficult'
  difficulty_level TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard'

  -- Additional Info
  answering_tips TEXT,
  common_for_roles TEXT[], -- ['Product Manager', 'Software Engineer']
  par_methodology_applicable BOOLEAN DEFAULT TRUE,

  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. MY QUESTION ANSWERS (User's Prepared Answers)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES interview_questions(id) ON DELETE CASCADE NOT NULL,

  -- Answer Content
  answer_text TEXT NOT NULL,

  -- Linked PAR Story (if using PAR methodology)
  par_story_id UUID REFERENCES par_stories(id) ON DELETE SET NULL,

  -- Practice Tracking
  times_practiced INTEGER DEFAULT 0,
  last_practiced_date TIMESTAMPTZ,
  confidence_level INTEGER DEFAULT 3, -- 1-5 (1=needs work, 5=confident)
  needs_improvement BOOLEAN DEFAULT TRUE,

  -- Notes
  improvement_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. PRACTICE SESSIONS (Phase 1: Before)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Practice Details
  practice_type TEXT, -- 'mirror', 'video_recording', 'with_friend', 'mock_interview'
  practice_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  -- Questions Practiced
  questions_practiced JSONB, -- Array of question_ids

  -- Self-Evaluation
  what_went_well TEXT,
  what_to_improve TEXT,
  overall_confidence INTEGER, -- 1-5

  -- Notes
  practice_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. INTERVIEW SESSION NOTES (Phase 2: During)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Session Info
  session_date TIMESTAMPTZ,
  duration_minutes INTEGER,

  -- Questions & Answers
  questions_asked TEXT[], -- Array of questions they asked
  difficult_moments TEXT,
  things_went_well TEXT,
  things_to_improve TEXT,

  -- Company Insights (learned during interview)
  company_challenges_discussed TEXT,
  team_dynamics_observed TEXT,
  company_culture_insights TEXT,
  next_steps_mentioned TEXT,

  -- Decision Factors
  salary_discussed TEXT,
  benefits_discussed TEXT,
  start_date_discussed TEXT,

  -- My Questions Asked
  my_questions_asked TEXT[],

  -- Overall Impression
  overall_feeling TEXT, -- 'excellent', 'good', 'neutral', 'poor'
  likelihood_to_advance TEXT, -- 'high', 'medium', 'low', 'unknown'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. THANK YOU NOTES (Phase 3: After)
-- ============================================
CREATE TABLE IF NOT EXISTS thank_you_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Recipient Info
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_role TEXT,

  -- Content
  note_subject TEXT,
  note_body TEXT NOT NULL,

  -- Personalization (from interview)
  conversation_callbacks TEXT[], -- Specific things discussed
  value_propositions TEXT[], -- What I can contribute based on their challenges
  clarifications TEXT[], -- Clarify something from the interview
  additional_info TEXT, -- Send additional information discussed

  -- Tracking
  sent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'draft', -- 'draft', 'sent', 'responded'
  response_received_date TIMESTAMPTZ,
  response_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. FOLLOW-UP TRACKING (Phase 3: After)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Follow-up Details
  followup_type TEXT NOT NULL, -- 'thank_you_note', 'status_check', 'additional_info', 'linkedin_message'
  followup_method TEXT, -- 'email', 'phone', 'linkedin'
  followup_date TIMESTAMPTZ NOT NULL,
  followup_message TEXT,

  -- Recommended Timeline
  recommended_followup_date TIMESTAMPTZ, -- 1 week, 1.5 weeks intervals
  is_within_recommended_timeline BOOLEAN DEFAULT TRUE,

  -- Response
  response_received BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  response_notes TEXT,

  -- Next Action
  next_action TEXT,
  next_action_date TIMESTAMPTZ,
  next_action_completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. NEGOTIATION PREPARATION (Phase 3: After)
-- ============================================
CREATE TABLE IF NOT EXISTS interview_negotiation_prep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_prep_id UUID REFERENCES interview_preparations(id) ON DELETE CASCADE NOT NULL,

  -- Salary Research
  market_salary_low INTEGER,
  market_salary_mid INTEGER,
  market_salary_high INTEGER,
  salary_sources TEXT[], -- Where research came from

  -- My Targets
  my_minimum_acceptable INTEGER,
  my_target_salary INTEGER,
  my_stretch_goal INTEGER,

  -- Other Negotiables
  negotiable_items JSONB, -- {signing_bonus, equity, pto, remote_work, etc.}
  non_negotiable_items TEXT[],

  -- Strategy
  negotiation_strategy TEXT,
  walk_away_point TEXT,

  -- Offer Received
  offer_received BOOLEAN DEFAULT FALSE,
  offer_details JSONB,
  offer_received_date TIMESTAMPTZ,
  offer_deadline TIMESTAMPTZ,

  -- Decision
  decision_made BOOLEAN DEFAULT FALSE,
  decision TEXT, -- 'accepted', 'declined', 'countered'
  decision_date TIMESTAMPTZ,
  decision_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_interview_prep_user_id ON interview_preparations(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_prep_status ON interview_preparations(status);
CREATE INDEX IF NOT EXISTS idx_interview_prep_date ON interview_preparations(interview_date);

CREATE INDEX IF NOT EXISTS idx_interview_research_prep_id ON interview_research(interview_prep_id);

CREATE INDEX IF NOT EXISTS idx_jd_comparison_prep_id ON jd_comparison_analysis(interview_prep_id);
CREATE INDEX IF NOT EXISTS idx_jd_comparison_par_id ON jd_comparison_analysis(my_experience_par_id);

CREATE INDEX IF NOT EXISTS idx_questions_category ON interview_questions(question_category);
CREATE INDEX IF NOT EXISTS idx_questions_active ON interview_questions(is_active);

CREATE INDEX IF NOT EXISTS idx_question_answers_user_id ON interview_question_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_question_id ON interview_question_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_question_answers_par_id ON interview_question_answers(par_story_id);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_prep_id ON interview_practice_sessions(interview_prep_id);

CREATE INDEX IF NOT EXISTS idx_interview_notes_prep_id ON interview_session_notes(interview_prep_id);

CREATE INDEX IF NOT EXISTS idx_thank_you_prep_id ON thank_you_notes(interview_prep_id);
CREATE INDEX IF NOT EXISTS idx_thank_you_status ON thank_you_notes(status);

CREATE INDEX IF NOT EXISTS idx_followups_prep_id ON interview_followups(interview_prep_id);
CREATE INDEX IF NOT EXISTS idx_followups_date ON interview_followups(followup_date);

CREATE INDEX IF NOT EXISTS idx_negotiation_prep_id ON interview_negotiation_prep(interview_prep_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE interview_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE jd_comparison_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_question_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE thank_you_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_negotiation_prep ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own interview preps" ON interview_preparations;
DROP POLICY IF EXISTS "Users can insert own interview preps" ON interview_preparations;
DROP POLICY IF EXISTS "Users can update own interview preps" ON interview_preparations;
DROP POLICY IF EXISTS "Users can delete own interview preps" ON interview_preparations;

DROP POLICY IF EXISTS "Users can view own interview research" ON interview_research;
DROP POLICY IF EXISTS "Users can insert own interview research" ON interview_research;
DROP POLICY IF EXISTS "Users can update own interview research" ON interview_research;
DROP POLICY IF EXISTS "Users can delete own interview research" ON interview_research;

DROP POLICY IF EXISTS "Users can view own JD comparisons" ON jd_comparison_analysis;
DROP POLICY IF EXISTS "Users can insert own JD comparisons" ON jd_comparison_analysis;
DROP POLICY IF EXISTS "Users can update own JD comparisons" ON jd_comparison_analysis;
DROP POLICY IF EXISTS "Users can delete own JD comparisons" ON jd_comparison_analysis;

DROP POLICY IF EXISTS "Everyone can view interview questions" ON interview_questions;

DROP POLICY IF EXISTS "Users can view own question answers" ON interview_question_answers;
DROP POLICY IF EXISTS "Users can insert own question answers" ON interview_question_answers;
DROP POLICY IF EXISTS "Users can update own question answers" ON interview_question_answers;
DROP POLICY IF EXISTS "Users can delete own question answers" ON interview_question_answers;

DROP POLICY IF EXISTS "Users can view own practice sessions" ON interview_practice_sessions;
DROP POLICY IF EXISTS "Users can insert own practice sessions" ON interview_practice_sessions;
DROP POLICY IF EXISTS "Users can update own practice sessions" ON interview_practice_sessions;
DROP POLICY IF EXISTS "Users can delete own practice sessions" ON interview_practice_sessions;

DROP POLICY IF EXISTS "Users can view own interview notes" ON interview_session_notes;
DROP POLICY IF EXISTS "Users can insert own interview notes" ON interview_session_notes;
DROP POLICY IF EXISTS "Users can update own interview notes" ON interview_session_notes;
DROP POLICY IF EXISTS "Users can delete own interview notes" ON interview_session_notes;

DROP POLICY IF EXISTS "Users can view own thank you notes" ON thank_you_notes;
DROP POLICY IF EXISTS "Users can insert own thank you notes" ON thank_you_notes;
DROP POLICY IF EXISTS "Users can update own thank you notes" ON thank_you_notes;
DROP POLICY IF EXISTS "Users can delete own thank you notes" ON thank_you_notes;

DROP POLICY IF EXISTS "Users can view own followups" ON interview_followups;
DROP POLICY IF EXISTS "Users can insert own followups" ON interview_followups;
DROP POLICY IF EXISTS "Users can update own followups" ON interview_followups;
DROP POLICY IF EXISTS "Users can delete own followups" ON interview_followups;

DROP POLICY IF EXISTS "Users can view own negotiation prep" ON interview_negotiation_prep;
DROP POLICY IF EXISTS "Users can insert own negotiation prep" ON interview_negotiation_prep;
DROP POLICY IF EXISTS "Users can update own negotiation prep" ON interview_negotiation_prep;
DROP POLICY IF EXISTS "Users can delete own negotiation prep" ON interview_negotiation_prep;

-- Create RLS Policies
-- interview_preparations
CREATE POLICY "Users can view own interview preps" ON interview_preparations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interview preps" ON interview_preparations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interview preps" ON interview_preparations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interview preps" ON interview_preparations FOR DELETE USING (auth.uid() = user_id);

-- interview_research
CREATE POLICY "Users can view own interview research" ON interview_research FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_research.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own interview research" ON interview_research FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_research.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own interview research" ON interview_research FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_research.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own interview research" ON interview_research FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_research.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- jd_comparison_analysis
CREATE POLICY "Users can view own JD comparisons" ON jd_comparison_analysis FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = jd_comparison_analysis.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own JD comparisons" ON jd_comparison_analysis FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = jd_comparison_analysis.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own JD comparisons" ON jd_comparison_analysis FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = jd_comparison_analysis.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own JD comparisons" ON jd_comparison_analysis FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = jd_comparison_analysis.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- interview_questions (public read-only)
CREATE POLICY "Everyone can view interview questions" ON interview_questions FOR SELECT USING (is_active = TRUE);

-- interview_question_answers
CREATE POLICY "Users can view own question answers" ON interview_question_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own question answers" ON interview_question_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own question answers" ON interview_question_answers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own question answers" ON interview_question_answers FOR DELETE USING (auth.uid() = user_id);

-- interview_practice_sessions
CREATE POLICY "Users can view own practice sessions" ON interview_practice_sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_practice_sessions.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own practice sessions" ON interview_practice_sessions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_practice_sessions.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own practice sessions" ON interview_practice_sessions FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_practice_sessions.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own practice sessions" ON interview_practice_sessions FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_practice_sessions.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- interview_session_notes
CREATE POLICY "Users can view own interview notes" ON interview_session_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_session_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own interview notes" ON interview_session_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_session_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own interview notes" ON interview_session_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_session_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own interview notes" ON interview_session_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_session_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- thank_you_notes
CREATE POLICY "Users can view own thank you notes" ON thank_you_notes FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = thank_you_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own thank you notes" ON thank_you_notes FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = thank_you_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own thank you notes" ON thank_you_notes FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = thank_you_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own thank you notes" ON thank_you_notes FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = thank_you_notes.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- interview_followups
CREATE POLICY "Users can view own followups" ON interview_followups FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_followups.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own followups" ON interview_followups FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_followups.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own followups" ON interview_followups FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_followups.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own followups" ON interview_followups FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_followups.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- interview_negotiation_prep
CREATE POLICY "Users can view own negotiation prep" ON interview_negotiation_prep FOR SELECT
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_negotiation_prep.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can insert own negotiation prep" ON interview_negotiation_prep FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_negotiation_prep.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can update own negotiation prep" ON interview_negotiation_prep FOR UPDATE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_negotiation_prep.interview_prep_id AND interview_preparations.user_id = auth.uid()));
CREATE POLICY "Users can delete own negotiation prep" ON interview_negotiation_prep FOR DELETE
  USING (EXISTS (SELECT 1 FROM interview_preparations WHERE interview_preparations.id = interview_negotiation_prep.interview_prep_id AND interview_preparations.user_id = auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on interview_preparations
CREATE OR REPLACE FUNCTION update_interview_prep_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_interview_prep_updated_at ON interview_preparations;
CREATE TRIGGER trigger_update_interview_prep_updated_at
  BEFORE UPDATE ON interview_preparations
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_prep_updated_at();

-- Update updated_at on interview_question_answers
CREATE OR REPLACE FUNCTION update_question_answer_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_question_answer_updated_at ON interview_question_answers;
CREATE TRIGGER trigger_update_question_answer_updated_at
  BEFORE UPDATE ON interview_question_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_question_answer_updated_at();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Interview Mastery System™ schema created successfully!' as status;

-- Show all interview tables
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'interview%'
ORDER BY table_name;

-- ============================================
-- END OF SCHEMA
-- ============================================
