-- ============================================================================
-- CareerTipsAI - Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: November 18, 2025
-- Database: PostgreSQL 15 (Supabase)
-- Description: Complete database schema for CareerTipsAI platform
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

-- Users table (managed by Supabase Auth, extended here)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT, -- NULL if OAuth
  full_name TEXT,
  preferred_language TEXT DEFAULT 'en', -- en, es, pt, fr
  subscription_tier TEXT DEFAULT 'free', -- free, pro, executive, corporate
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Core user accounts and authentication';
COMMENT ON COLUMN users.preferred_language IS 'User interface language: en, es, pt, fr';
COMMENT ON COLUMN users.subscription_tier IS 'Current subscription level: free, pro, executive, corporate';

-- ============================================================================
-- USER PROFILES & CAREER CONTEXT
-- ============================================================================

-- User Profiles (Career Context)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  current_situation TEXT, -- actively_job_hunting, exploring, feeling_stuck, recently_laid_off, new_graduate, career_changer
  top_priority TEXT, -- better_job, higher_salary, career_change, work_life_balance, remote_work, international_opportunity
  target_job_title TEXT,
  current_location TEXT,
  target_locations TEXT[], -- array of cities/countries
  remote_preference TEXT, -- remote_only, hybrid, on_site, flexible
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  currency TEXT DEFAULT 'USD',
  years_experience INTEGER,
  industries TEXT[], -- array of industries
  company_sizes TEXT[], -- startup, small, medium, large, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE user_profiles IS 'User career context and job search preferences';

-- Onboarding Responses (Career Clarity Snapshot)
CREATE TABLE onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL, -- current_situation, top_priority, target_job_title, location, language
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE onboarding_responses IS 'Raw onboarding question responses for Career Clarity Snapshot';

-- ============================================================================
-- RESUMES & WORK EXPERIENCE
-- ============================================================================

-- Resume Versions (Multiple resumes per user)
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  version_name TEXT NOT NULL, -- "General Resume", "Google PM Resume", etc.
  resume_type TEXT DEFAULT 'chronological', -- chronological, functional, hybrid
  template_style TEXT DEFAULT 'classic', -- classic, modern, executive
  is_active BOOLEAN DEFAULT TRUE,
  is_primary BOOLEAN DEFAULT FALSE, -- user's main resume
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE resume_versions IS 'Multiple resume versions per user (general, job-specific, etc.)';
COMMENT ON COLUMN resume_versions.resume_type IS 'chronological, functional, or hybrid resume format';

-- Roles (Work Experience)
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_location TEXT,
  company_size TEXT, -- startup, small, medium, large, enterprise
  company_industry TEXT,
  company_revenue TEXT, -- e.g., "$10M ARR"
  job_title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if current role
  is_current BOOLEAN DEFAULT FALSE,
  role_purpose TEXT, -- why the role existed
  role_scope_budget INTEGER,
  role_scope_headcount INTEGER,
  role_scope_geography TEXT,
  role_scope_vendors INTEGER,
  tools_used TEXT[], -- array of tools/technologies
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE roles IS 'Work experience roles with company context and scope details';

-- PAR Accomplishments (Problem-Action-Result)
CREATE TABLE par_accomplishments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  problem_challenge TEXT NOT NULL,
  actions TEXT[] NOT NULL, -- array of 2-3 actions
  result TEXT NOT NULL,
  metrics TEXT[] NOT NULL, -- extracted metrics (15%, $200K, 6 months)
  passion_score INTEGER CHECK (passion_score BETWEEN 1 AND 5), -- would I do this again? 1=no, 5=yes
  competencies TEXT[], -- array of competencies demonstrated
  accomplishment_bullet TEXT, -- AI-generated bullet (Verb + Scope + Action + Metric)
  bullet_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE par_accomplishments IS 'Interview-Magnet Resume System PAR (Problem-Action-Result) stories';
COMMENT ON COLUMN par_accomplishments.passion_score IS 'Would you do this type of work again? 1=no, 5=yes';

-- Competencies (Skills/Keywords)
CREATE TABLE competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  competency_name TEXT NOT NULL,
  competency_category TEXT, -- technical, soft_skill, leadership, domain_expertise
  proficiency_level TEXT, -- beginner, intermediate, advanced, expert
  years_experience INTEGER,
  source TEXT, -- resume, par, certification, manual
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE competencies IS 'User skills and competencies extracted from resume, PARs, certifications';

-- ============================================================================
-- EDUCATION & CERTIFICATIONS
-- ============================================================================

-- Education
CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  degree_type TEXT, -- Bachelor, Master, PhD, Certificate, Associate
  field_of_study TEXT,
  graduation_year INTEGER,
  gpa NUMERIC(3,2), -- optional, e.g., 3.85
  honors TEXT, -- magna cum laude, summa cum laude, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE education IS 'Academic degrees and educational background';

-- Certifications
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  expiration_date DATE, -- NULL if no expiration
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE certifications IS 'Professional certifications and credentials';

-- ============================================================================
-- JOB SEARCH & APPLICATIONS
-- ============================================================================

-- Job Searches (Saved Searches)
CREATE TABLE job_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  target_titles TEXT[] NOT NULL,
  target_locations TEXT[],
  remote_preference TEXT, -- remote_only, hybrid, on_site, flexible
  salary_min INTEGER,
  salary_max INTEGER,
  company_sizes TEXT[], -- startup, small, medium, large, enterprise
  industries TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE job_searches IS 'Saved job search criteria for recurring searches';

-- Jobs (Discovered Jobs from Aggregation)
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_job_id TEXT UNIQUE, -- ID from job board (LinkedIn, Indeed, ZipRecruiter)
  source TEXT NOT NULL, -- linkedin, indeed, ziprecruiter, glassdoor, manual
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_logo_url TEXT,
  location TEXT,
  remote_type TEXT, -- remote, hybrid, on_site
  salary_min INTEGER,
  salary_max INTEGER,
  job_description TEXT NOT NULL,
  required_skills TEXT[],
  preferred_skills TEXT[],
  application_url TEXT NOT NULL,
  application_deadline DATE,
  posted_date DATE,
  discovered_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE jobs IS 'Aggregated jobs from LinkedIn, Indeed, ZipRecruiter, Glassdoor';

-- Job Applications (User Actions)
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  resume_version_id UUID REFERENCES resume_versions(id),
  application_status TEXT DEFAULT 'pending_approval', -- pending_approval, submitted, under_review, interview_scheduled, rejected, offer_received, offer_accepted
  match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
  tailored_resume_url TEXT, -- S3/Supabase Storage URL
  cover_letter TEXT,
  submitted_at TIMESTAMPTZ,
  ai_applied BOOLEAN DEFAULT FALSE, -- TRUE if autonomous agent applied
  user_approved BOOLEAN DEFAULT FALSE,
  response_received BOOLEAN DEFAULT FALSE,
  response_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE job_applications IS 'Job applications submitted by user or AI agent';
COMMENT ON COLUMN job_applications.ai_applied IS 'TRUE if autonomous agent applied on behalf of user';

-- ============================================================================
-- INTERVIEW PREP
-- ============================================================================

-- Interviews
CREATE TABLE interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE,
  interview_type TEXT, -- phone_screen, technical, behavioral, case_study, final_round
  interview_date TIMESTAMPTZ,
  interview_duration INTEGER, -- minutes
  interviewer_name TEXT,
  interview_mode TEXT, -- phone, video, in_person
  prep_completed BOOLEAN DEFAULT FALSE,
  company_research_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  outcome TEXT, -- pending, passed, rejected
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE interviews IS 'Scheduled interviews linked to job applications';

-- Interview Questions (User's STAR Answers Library)
CREATE TABLE interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_category TEXT, -- behavioral, technical, situational, company_specific
  star_situation TEXT,
  star_task TEXT,
  star_action TEXT,
  star_result TEXT,
  ai_feedback TEXT, -- AI critique of STAR answer
  answer_score INTEGER CHECK (answer_score BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE interview_questions IS 'User library of practiced STAR answers for common interview questions';

-- Mock Interviews (Practice Sessions)
CREATE TABLE mock_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_company TEXT,
  target_role TEXT,
  interview_type TEXT, -- behavioral, technical, case_study
  mode TEXT, -- text, voice
  questions_asked TEXT[], -- array of question IDs or text
  transcript JSONB, -- full conversation (questions + answers)
  overall_score INTEGER CHECK (overall_score BETWEEN 1 AND 10),
  feedback_summary TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mock_interviews IS 'AI-powered mock interview practice sessions';

-- ============================================================================
-- LEARNING & SKILL DEVELOPMENT
-- ============================================================================

-- Learning Paths (Skill Development Plans)
CREATE TABLE learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  skill_gap_priority TEXT, -- critical, nice_to_have
  recommended_courses JSONB, -- array of {course_name, provider, url, duration, price}
  selected_course_url TEXT,
  estimated_completion_weeks INTEGER,
  progress_percentage INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE learning_paths IS 'Personalized learning paths to close skill gaps';

-- ============================================================================
-- WEEKLY REINVENTION CYCLE
-- ============================================================================

-- Weekly Goals (Reinvention Cycle)
CREATE TABLE weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  focus_area TEXT, -- apply_to_jobs, improve_resume, practice_interviews, learn_skill
  goal_description TEXT,
  target_metric INTEGER, -- e.g., 5 applications, 3 mock interviews
  actual_metric INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE weekly_goals IS 'Monday ritual: Weekly career goals and focus areas';

-- Daily Tasks (Micro-Tasks from Weekly Goals)
CREATE TABLE daily_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_goal_id UUID REFERENCES weekly_goals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL,
  task_description TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE daily_tasks IS 'Daily micro-tasks broken down from weekly goals';

-- ============================================================================
-- EMOTIONAL REINVENTION & JOURNALING
-- ============================================================================

-- Journal Entries (Emotional Reinvention)
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  entry_date DATE DEFAULT CURRENT_DATE,
  entry_text TEXT NOT NULL,
  sentiment_score NUMERIC(3,2), -- -1.0 (very negative) to +1.0 (very positive)
  sentiment_label TEXT, -- positive, neutral, negative, burnout_risk
  ai_response TEXT, -- AI's coaching response
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE journal_entries IS 'Daily reflections with AI sentiment analysis and coaching';
COMMENT ON COLUMN journal_entries.sentiment_score IS 'AI sentiment score: -1.0 (very negative) to +1.0 (very positive)';

-- ============================================================================
-- SYSTEM & OPERATIONAL TABLES
-- ============================================================================

-- Activity Logs (Audit Trail)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- resume_created, job_applied, interview_scheduled, goal_completed, etc.
  activity_metadata JSONB, -- flexible field for additional context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE activity_logs IS 'Audit trail of all user activities for analytics and debugging';

-- AI Cost Tracking (Operational Monitoring)
CREATE TABLE ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  model_used TEXT NOT NULL, -- gpt-4o, gpt-4o-mini, claude-3-5-sonnet
  endpoint TEXT NOT NULL, -- /api/resume/generate-bullet, /api/interview/validate-star
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_usd NUMERIC(10,6),
  request_timestamp TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ai_cost_tracking IS 'Track AI API costs per user and endpoint for unit economics analysis';

-- ============================================================================
-- SUBSCRIPTIONS & PAYMENTS
-- ============================================================================

-- Subscriptions (Stripe Integration)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  plan_tier TEXT NOT NULL, -- free, pro, executive
  billing_interval TEXT, -- monthly, annual
  price_usd INTEGER, -- in cents (e.g., 1900 for $19.00, 4900 for $49.00)
  status TEXT NOT NULL, -- active, cancelled, past_due, unpaid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS 'Stripe subscription tracking';
COMMENT ON COLUMN subscriptions.price_usd IS 'Price in cents (e.g., 4900 = $49.00)';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Profiles
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- Resumes
CREATE INDEX idx_resume_versions_user_id ON resume_versions(user_id);
CREATE INDEX idx_resume_versions_is_primary ON resume_versions(is_primary) WHERE is_primary = TRUE;

-- Roles & Accomplishments
CREATE INDEX idx_roles_user_id ON roles(user_id);
CREATE INDEX idx_par_user_id ON par_accomplishments(user_id);
CREATE INDEX idx_par_role_id ON par_accomplishments(role_id);
CREATE INDEX idx_par_bullet_approved ON par_accomplishments(bullet_approved);

-- Competencies
CREATE INDEX idx_competencies_user_id ON competencies(user_id);
CREATE INDEX idx_competencies_name ON competencies(competency_name);

-- Jobs
CREATE INDEX idx_jobs_posted_date ON jobs(posted_date DESC);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_external_id ON jobs(external_job_id);

-- Job Applications
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_status ON job_applications(application_status);
CREATE INDEX idx_job_applications_submitted_at ON job_applications(submitted_at DESC);

-- Interviews
CREATE INDEX idx_interviews_user_id ON interviews(user_id);
CREATE INDEX idx_interviews_date ON interviews(interview_date);

-- Weekly Goals & Tasks
CREATE INDEX idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX idx_weekly_goals_week ON weekly_goals(week_start_date);
CREATE INDEX idx_daily_tasks_user_id ON daily_tasks(user_id);
CREATE INDEX idx_daily_tasks_date ON daily_tasks(task_date);

-- Journals
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date DESC);

-- Activity Logs
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(activity_type);

-- AI Cost Tracking
CREATE INDEX idx_ai_cost_user_id ON ai_cost_tracking(user_id);
CREATE INDEX idx_ai_cost_timestamp ON ai_cost_tracking(request_timestamp DESC);
CREATE INDEX idx_ai_cost_model ON ai_cost_tracking(model_used);

-- Subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE par_accomplishments ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users: Can only see their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- User Profiles: Full CRUD for own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Resume Versions: Full CRUD for own resumes
CREATE POLICY "Users can view own resumes"
  ON resume_versions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own resumes"
  ON resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes"
  ON resume_versions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes"
  ON resume_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Roles: Full CRUD for own roles
CREATE POLICY "Users can view own roles"
  ON roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own roles"
  ON roles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roles"
  ON roles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roles"
  ON roles FOR DELETE
  USING (auth.uid() = user_id);

-- PAR Accomplishments: Full CRUD for own PARs
CREATE POLICY "Users can view own PARs"
  ON par_accomplishments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own PARs"
  ON par_accomplishments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PARs"
  ON par_accomplishments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own PARs"
  ON par_accomplishments FOR DELETE
  USING (auth.uid() = user_id);

-- Jobs: Public read (all users can discover jobs)
CREATE POLICY "Jobs are publicly visible"
  ON jobs FOR SELECT
  TO authenticated
  USING (true);

-- Job Applications: Full CRUD for own applications
CREATE POLICY "Users can view own applications"
  ON job_applications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON job_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON job_applications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON job_applications FOR DELETE
  USING (auth.uid() = user_id);

-- Interviews: Full CRUD for own interviews
CREATE POLICY "Users can view own interviews"
  ON interviews FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interviews"
  ON interviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interviews"
  ON interviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Weekly Goals & Daily Tasks: Full CRUD for own goals/tasks
CREATE POLICY "Users can view own weekly goals"
  ON weekly_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own weekly goals"
  ON weekly_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weekly goals"
  ON weekly_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily tasks"
  ON daily_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily tasks"
  ON daily_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily tasks"
  ON daily_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Journal Entries: Full CRUD for own journals
CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Activity Logs: Users can view own activity, system can insert
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (true); -- Allow system to log all user activities

-- AI Cost Tracking: System only (admins can view all)
CREATE POLICY "System can track AI costs"
  ON ai_cost_tracking FOR INSERT
  WITH CHECK (true);

-- Subscriptions: Users can view own subscription
CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_versions_updated_at BEFORE UPDATE ON resume_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_par_accomplishments_updated_at BEFORE UPDATE ON par_accomplishments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_searches_updated_at BEFORE UPDATE ON job_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_interview_questions_updated_at BEFORE UPDATE ON interview_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA (Optional - for development/testing)
-- ============================================================================

-- Example seed user (remove in production)
-- INSERT INTO users (id, email, full_name, preferred_language, subscription_tier, onboarding_completed)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'demo@careertipsai.com',
--   'Demo User',
--   'en',
--   'pro',
--   true
-- );

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Verify schema creation
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

COMMENT ON SCHEMA public IS 'CareerTipsAI Database Schema v1.0 - November 18, 2025';
