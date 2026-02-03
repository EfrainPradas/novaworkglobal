-- ========================================
-- FAST-TRACK JOB SEARCH SYSTEM™ - DATABASE SCHEMA
-- CareerTipsAI - Complete 4-Step Job Search Methodology
-- Based on: "The Fast-Track Job Search System - Get Called 75% Faster"
-- ========================================

-- ========================================
-- STEP 1: PLAN YOUR SEARCH
-- Job Market Research - "From scattered applications to a clear, targeted strategy"
-- ========================================

-- Target Company Criteria: Define ideal employer profile
CREATE TABLE IF NOT EXISTS target_company_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Criteria fields from workbook
  industry TEXT,
  role_function TEXT,
  geography TEXT,
  company_size TEXT, -- e.g., "50-200 employees", "Enterprise (1000+)"
  sector TEXT, -- e.g., "Private", "Public", "Non-profit"
  revenue_range TEXT, -- e.g., "$10M-$50M", "$1B+"
  employee_count_range TEXT, -- e.g., "100-500", "5000+"
  salary_range TEXT, -- e.g., "$80K-$120K"
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Industry Research: Map top industries to understand opportunities
CREATE TABLE IF NOT EXISTS industry_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Industry info from workbook
  industry TEXT NOT NULL,
  market_trends TEXT, -- What's happening in the market
  growth_risks TEXT, -- Growth opportunities and risks
  recent_news TEXT, -- Recent shifts, acquisitions, etc.
  top_employers TEXT[], -- Array of company names
  salary_benchmarks TEXT, -- Industry salary ranges
  notes TEXT,

  -- AI-assisted research
  ai_generated BOOLEAN DEFAULT FALSE,
  last_ai_refresh_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company Shortlist: Deep research on target companies
CREATE TABLE IF NOT EXISTS company_shortlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Company details from workbook
  company_name TEXT NOT NULL,
  industry TEXT,
  why_fits_criteria TEXT, -- Why this company matches your target criteria
  recent_news TEXT, -- Recent moves, expansions, layoffs
  financials_growth TEXT, -- Financial health, revenue growth
  openings_closings TEXT, -- Plants, facilities, offices opening/closing

  -- Contact tracking
  key_contacts JSONB DEFAULT '[]', -- [{name, role, linkedin_url, email, phone}]

  -- Application tracking
  application_status TEXT DEFAULT 'researching', -- researching, ready_to_apply, applied, interviewing, offer, rejected
  follow_up_date DATE,

  -- Prioritization (5-6 criteria match = high priority)
  priority_score INTEGER CHECK (priority_score BETWEEN 0 AND 10),
  criteria_match_count INTEGER DEFAULT 0, -- How many of your criteria this company matches

  -- AI-assisted research
  ai_generated BOOLEAN DEFAULT FALSE,
  last_ai_refresh_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 2: APPLY SMART ONLINE
-- "The key isn't applying everywhere, it's applying smarter"
-- ========================================

-- Job Applications Tracker: Enhanced tracking with referral system
CREATE TABLE IF NOT EXISTS job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Link to tailored resume (if generated through JD Analyzer)
  tailored_resume_id UUID REFERENCES tailored_resumes(id) ON DELETE SET NULL,
  company_shortlist_id UUID REFERENCES company_shortlist(id) ON DELETE SET NULL,

  -- Job details from workbook
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  where_found TEXT, -- 'Google Jobs', 'LinkedIn', 'Company Portal', 'Referral', etc.
  date_found DATE DEFAULT CURRENT_DATE,
  link_to_posting TEXT,

  -- Resume tailoring from workbook
  top_keywords TEXT[], -- Keywords identified from JD
  resume_adapted BOOLEAN DEFAULT FALSE,
  cover_letter_needed BOOLEAN DEFAULT FALSE,
  file_name_saved_as TEXT,

  -- Referral system (80% success rate vs 1-2% without referral)
  referral_requested BOOLEAN DEFAULT FALSE,
  referral_contact_name TEXT,
  referral_contact_role TEXT,
  referral_contact_linkedin TEXT,
  referral_date_reached_out DATE,
  referral_response TEXT,
  referral_made BOOLEAN DEFAULT FALSE,

  -- Application status
  application_status TEXT DEFAULT 'found', -- found, tailoring, applied, followed_up, interviewing, offer, rejected
  date_applied DATE,
  application_method TEXT, -- 'Company Portal', 'LinkedIn Easy Apply', 'Email to Recruiter'

  -- Follow-up system
  auto_follow_up_date DATE, -- Auto-calculated: 7 days after application
  last_follow_up_date DATE,
  follow_up_count INTEGER DEFAULT 0,
  follow_up_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume Tailoring Checklist: Track adaptation for each job
CREATE TABLE IF NOT EXISTS resume_tailoring_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_application_id UUID REFERENCES job_applications(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Checklist items from workbook
  keywords_identified BOOLEAN DEFAULT FALSE,
  resume_adapted BOOLEAN DEFAULT FALSE,
  cover_letter_created BOOLEAN DEFAULT FALSE,
  file_saved_correctly BOOLEAN DEFAULT FALSE,
  ats_friendly_format BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 3: LEVERAGE RECRUITERS
-- "The best strategy with recruiters is VISIBILITY, not volume"
-- ========================================

-- Recruiters CRM: Track recruiter relationships
CREATE TABLE IF NOT EXISTS recruiters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Recruiter details from workbook
  recruiter_name TEXT NOT NULL,
  firm_name TEXT,
  recruiter_type TEXT, -- 'Retained', 'Contingent', 'In-House'
  specialty TEXT, -- 'Finance', 'Supply Chain', 'Healthcare', 'Technology', etc.

  -- Contact info
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,

  -- Filters from workbook
  geography TEXT, -- Where they place candidates
  seniority_level TEXT, -- 'Junior Recruiter', 'Senior Partner', 'Talent Acquisition Leader'
  industries_served TEXT[], -- Array of industries

  -- Top 25% prioritization (from Forbes, Hunt Scanlon, LinkedIn Lists)
  is_top_25_percent BOOLEAN DEFAULT FALSE,
  why_top_25_percent TEXT, -- Reason for prioritization
  ranking_source TEXT, -- 'Forbes', 'Hunt Scanlon', 'LinkedIn Lists', etc.

  -- Interaction tracking
  date_resume_sent DATE,
  last_contact_date DATE,
  next_contact_date DATE, -- Auto-calculated: every 3 months
  response_notes TEXT,

  -- Relationship strength
  relationship_strength TEXT DEFAULT 'cold', -- 'cold', 'warm', 'hot'

  -- Opportunities from this recruiter
  opportunities_presented INTEGER DEFAULT 0,
  interviews_from_recruiter INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recruiter Interactions: Track all communications
CREATE TABLE IF NOT EXISTS recruiter_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID REFERENCES recruiters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  interaction_type TEXT NOT NULL, -- 'initial_email', 'follow_up', 'phone_call', 'meeting', 'opportunity_presented'
  interaction_date DATE DEFAULT CURRENT_DATE,
  interaction_notes TEXT,

  -- If opportunity was presented
  job_title TEXT,
  company TEXT,
  outcome TEXT, -- 'submitted', 'interview', 'offer', 'rejected', 'not_interested'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 4: NETWORK WITH IMPACT
-- "Networking can be up to 80% effective"
-- ========================================

-- Networking Contacts: Track all networking relationships
CREATE TABLE IF NOT EXISTS networking_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Contact details from workbook
  contact_name TEXT NOT NULL,
  company TEXT,
  role_title TEXT,
  department TEXT,

  -- Relationship context
  how_i_know_them TEXT, -- 'College', 'Previous Company', 'LinkedIn', 'Referral from X', 'Conference'

  -- Contact info
  linkedin_url TEXT,
  email TEXT,
  phone TEXT,

  -- Interaction tracking
  last_contact_date DATE,
  next_contact_date DATE,
  last_interaction_type TEXT, -- 'coffee_chat', 'informational_interview', 'email', 'linkedin_message', 'phone_call'

  -- Relationship strength
  relationship_strength TEXT DEFAULT 'cold', -- 'cold', 'warm', 'hot'

  -- Value tracking
  referrals_provided INTEGER DEFAULT 0,
  introductions_made INTEGER DEFAULT 0,
  opportunities_from_contact INTEGER DEFAULT 0,

  -- Tags for filtering
  tags TEXT[], -- ['decision_maker', 'referral_source', 'mentor', 'peer', 'alumni']

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Networking Interactions: Track all conversations
CREATE TABLE IF NOT EXISTS networking_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES networking_contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  interaction_date DATE DEFAULT CURRENT_DATE,
  interaction_type TEXT NOT NULL, -- 'informational_interview', 'coffee_chat', 'email', 'linkedin_message', 'phone_call', 'event'

  -- Details
  interaction_notes TEXT,
  key_takeaways TEXT,
  action_items TEXT,

  -- Follow-up
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 60-Day Networking Plan: Structured 8-week plan from workbook
CREATE TABLE IF NOT EXISTS networking_60day_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Week tracking (1-8)
  week_number INTEGER CHECK (week_number BETWEEN 1 AND 8) NOT NULL,

  -- Goals from workbook (pre-populated for each week)
  goals TEXT NOT NULL,

  -- Progress tracking
  completed BOOLEAN DEFAULT FALSE,
  progress_notes TEXT,
  completion_date DATE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, week_number)
);

-- 90-Second Intro: User's elevator pitch/story
CREATE TABLE IF NOT EXISTS user_90_second_intro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Story components from workbook template
  headline TEXT, -- "I'm a [role] with [X years] in [industry]"
  career_story TEXT, -- 2-3 highlights showing intentional choices
  why_behind_path TEXT, -- Values, motivation (e.g., "driving efficiency and building systems")
  where_going TEXT, -- Target roles/industries

  -- Complete intro
  full_intro_text TEXT, -- Complete 90-second intro

  -- Versions (users can have multiple variations)
  version_name TEXT DEFAULT 'Main',
  is_active BOOLEAN DEFAULT TRUE,

  -- AI-generated flag
  ai_generated BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- AUTO-REMINDERS & FOLLOW-UPS
-- Automated system to keep users on track
-- ========================================

CREATE TABLE IF NOT EXISTS auto_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Reminder details
  reminder_type TEXT NOT NULL,
  -- Types:
  -- 'job_application_follow_up' (7 days after apply)
  -- 'recruiter_reconnect' (every 3 months)
  -- 'networking_touch_base' (based on last contact)
  -- 'interview_prep' (24 hours before interview)
  -- 'weekly_networking_goal' (from 60-day plan)

  -- Related entity
  related_entity_type TEXT, -- 'job_application', 'recruiter', 'networking_contact', etc.
  related_entity_id UUID, -- ID of the related entity

  -- Reminder scheduling
  reminder_date DATE NOT NULL,
  reminder_message TEXT NOT NULL,
  reminder_action TEXT, -- Suggested action to take

  -- Status
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  snoozed_until DATE,

  -- Priority
  priority TEXT DEFAULT 'medium', -- 'high', 'medium', 'low'

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- FAST-TRACK METRICS & ANALYTICS
-- Dashboard metrics for tracking effectiveness
-- ========================================

CREATE TABLE IF NOT EXISTS fast_track_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Calculated weekly
  metric_week_start DATE NOT NULL,

  -- Step 1 Metrics: Planning
  target_companies_identified INTEGER DEFAULT 0,
  industries_researched INTEGER DEFAULT 0,
  companies_shortlisted INTEGER DEFAULT 0,

  -- Step 2 Metrics: Applications
  jobs_found INTEGER DEFAULT 0,
  resumes_tailored INTEGER DEFAULT 0,
  applications_submitted INTEGER DEFAULT 0,
  referrals_requested INTEGER DEFAULT 0,
  referrals_obtained INTEGER DEFAULT 0,

  -- Step 3 Metrics: Recruiters
  recruiters_contacted INTEGER DEFAULT 0,
  recruiter_responses INTEGER DEFAULT 0,
  recruiter_opportunities INTEGER DEFAULT 0,

  -- Step 4 Metrics: Networking
  networking_contacts_added INTEGER DEFAULT 0,
  networking_meetings_held INTEGER DEFAULT 0,
  networking_introductions_received INTEGER DEFAULT 0,

  -- Conversion Metrics
  application_to_interview_rate DECIMAL(5,2), -- %
  referral_success_rate DECIMAL(5,2), -- %
  network_opportunity_rate DECIMAL(5,2), -- %

  -- Overall Effectiveness Score (0-100)
  fast_track_score INTEGER CHECK (fast_track_score BETWEEN 0 AND 100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, metric_week_start)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Step 1: Plan Your Search
CREATE INDEX IF NOT EXISTS idx_target_company_criteria_user_id ON target_company_criteria(user_id);
CREATE INDEX IF NOT EXISTS idx_industry_research_user_id ON industry_research(user_id);
CREATE INDEX IF NOT EXISTS idx_company_shortlist_user_id ON company_shortlist(user_id);
CREATE INDEX IF NOT EXISTS idx_company_shortlist_priority ON company_shortlist(user_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_company_shortlist_status ON company_shortlist(user_id, application_status);

-- Step 2: Apply Smart Online
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(user_id, application_status);
CREATE INDEX IF NOT EXISTS idx_job_applications_follow_up ON job_applications(user_id, auto_follow_up_date) WHERE auto_follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resume_tailoring_checklist_job_id ON resume_tailoring_checklist(job_application_id);

-- Step 3: Leverage Recruiters
CREATE INDEX IF NOT EXISTS idx_recruiters_user_id ON recruiters(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiters_top_25 ON recruiters(user_id) WHERE is_top_25_percent = TRUE;
CREATE INDEX IF NOT EXISTS idx_recruiters_next_contact ON recruiters(user_id, next_contact_date);
CREATE INDEX IF NOT EXISTS idx_recruiter_interactions_recruiter_id ON recruiter_interactions(recruiter_id);

-- Step 4: Network with Impact
CREATE INDEX IF NOT EXISTS idx_networking_contacts_user_id ON networking_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_next_contact ON networking_contacts(user_id, next_contact_date);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_strength ON networking_contacts(user_id, relationship_strength);
CREATE INDEX IF NOT EXISTS idx_networking_interactions_contact_id ON networking_interactions(contact_id);
CREATE INDEX IF NOT EXISTS idx_networking_60day_plan_user_week ON networking_60day_plan(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_user_90_second_intro_user_active ON user_90_second_intro(user_id) WHERE is_active = TRUE;

-- Auto Reminders
CREATE INDEX IF NOT EXISTS idx_auto_reminders_user_date ON auto_reminders(user_id, reminder_date) WHERE NOT completed;
CREATE INDEX IF NOT EXISTS idx_auto_reminders_type ON auto_reminders(user_id, reminder_type) WHERE NOT completed;

-- Metrics
CREATE INDEX IF NOT EXISTS idx_fast_track_metrics_user_week ON fast_track_metrics(user_id, metric_week_start DESC);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE target_company_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_shortlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_tailoring_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiters ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE networking_60day_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_90_second_intro ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE fast_track_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see their own data)

-- Step 1 Policies
CREATE POLICY "Users can view their own target company criteria" ON target_company_criteria FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own target company criteria" ON target_company_criteria FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own target company criteria" ON target_company_criteria FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own target company criteria" ON target_company_criteria FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own industry research" ON industry_research FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own industry research" ON industry_research FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own industry research" ON industry_research FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own industry research" ON industry_research FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own company shortlist" ON company_shortlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own company shortlist" ON company_shortlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own company shortlist" ON company_shortlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own company shortlist" ON company_shortlist FOR DELETE USING (auth.uid() = user_id);

-- Step 2 Policies
CREATE POLICY "Users can view their own job applications" ON job_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own job applications" ON job_applications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own job applications" ON job_applications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own job applications" ON job_applications FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own resume tailoring checklist" ON resume_tailoring_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resume tailoring checklist" ON resume_tailoring_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resume tailoring checklist" ON resume_tailoring_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resume tailoring checklist" ON resume_tailoring_checklist FOR DELETE USING (auth.uid() = user_id);

-- Step 3 Policies
CREATE POLICY "Users can view their own recruiters" ON recruiters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recruiters" ON recruiters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recruiters" ON recruiters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recruiters" ON recruiters FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recruiter interactions" ON recruiter_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recruiter interactions" ON recruiter_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recruiter interactions" ON recruiter_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recruiter interactions" ON recruiter_interactions FOR DELETE USING (auth.uid() = user_id);

-- Step 4 Policies
CREATE POLICY "Users can view their own networking contacts" ON networking_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own networking contacts" ON networking_contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own networking contacts" ON networking_contacts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own networking contacts" ON networking_contacts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own networking interactions" ON networking_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own networking interactions" ON networking_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own networking interactions" ON networking_interactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own networking interactions" ON networking_interactions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own 60-day plan" ON networking_60day_plan FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own 60-day plan" ON networking_60day_plan FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own 60-day plan" ON networking_60day_plan FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own 60-day plan" ON networking_60day_plan FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own 90-second intro" ON user_90_second_intro FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own 90-second intro" ON user_90_second_intro FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own 90-second intro" ON user_90_second_intro FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own 90-second intro" ON user_90_second_intro FOR DELETE USING (auth.uid() = user_id);

-- Auto Reminders Policies
CREATE POLICY "Users can view their own auto reminders" ON auto_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own auto reminders" ON auto_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own auto reminders" ON auto_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own auto reminders" ON auto_reminders FOR DELETE USING (auth.uid() = user_id);

-- Metrics Policies
CREATE POLICY "Users can view their own metrics" ON fast_track_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own metrics" ON fast_track_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own metrics" ON fast_track_metrics FOR UPDATE USING (auth.uid() = user_id);

-- ========================================
-- TRIGGERS FOR AUTO-UPDATES
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_target_company_criteria_updated_at BEFORE UPDATE ON target_company_criteria FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_industry_research_updated_at BEFORE UPDATE ON industry_research FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_shortlist_updated_at BEFORE UPDATE ON company_shortlist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_applications_updated_at BEFORE UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_resume_tailoring_checklist_updated_at BEFORE UPDATE ON resume_tailoring_checklist FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recruiters_updated_at BEFORE UPDATE ON recruiters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_networking_contacts_updated_at BEFORE UPDATE ON networking_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_networking_60day_plan_updated_at BEFORE UPDATE ON networking_60day_plan FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_90_second_intro_updated_at BEFORE UPDATE ON user_90_second_intro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create follow-up reminders for job applications
CREATE OR REPLACE FUNCTION create_job_application_follow_up()
RETURNS TRIGGER AS $$
BEGIN
    -- When application is submitted, create auto follow-up reminder for 7 days later
    IF NEW.application_status = 'applied' AND NEW.date_applied IS NOT NULL THEN
        NEW.auto_follow_up_date := NEW.date_applied + INTERVAL '7 days';

        -- Create auto reminder
        INSERT INTO auto_reminders (
            user_id,
            reminder_type,
            related_entity_type,
            related_entity_id,
            reminder_date,
            reminder_message,
            reminder_action,
            priority
        ) VALUES (
            NEW.user_id,
            'job_application_follow_up',
            'job_application',
            NEW.id,
            NEW.auto_follow_up_date,
            'Follow up on your application to ' || NEW.company || ' for ' || NEW.job_title,
            'Send a follow-up email or LinkedIn message to the hiring manager',
            'high'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_application_auto_follow_up
BEFORE INSERT OR UPDATE ON job_applications
FOR EACH ROW EXECUTE FUNCTION create_job_application_follow_up();

-- Function to auto-create recruiter reconnect reminders
CREATE OR REPLACE FUNCTION create_recruiter_reconnect_reminder()
RETURNS TRIGGER AS $$
BEGIN
    -- When resume is sent to recruiter, create reminder to reconnect in 3 months
    IF NEW.date_resume_sent IS NOT NULL AND (OLD.date_resume_sent IS NULL OR NEW.date_resume_sent != OLD.date_resume_sent) THEN
        NEW.next_contact_date := NEW.date_resume_sent + INTERVAL '3 months';

        -- Create auto reminder
        INSERT INTO auto_reminders (
            user_id,
            reminder_type,
            related_entity_type,
            related_entity_id,
            reminder_date,
            reminder_message,
            reminder_action,
            priority
        ) VALUES (
            NEW.user_id,
            'recruiter_reconnect',
            'recruiter',
            NEW.id,
            NEW.next_contact_date,
            'Reconnect with ' || NEW.recruiter_name || ' at ' || COALESCE(NEW.firm_name, 'their firm'),
            'Send a brief update email to stay on their radar',
            'medium'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recruiter_auto_reconnect
BEFORE INSERT OR UPDATE ON recruiters
FOR EACH ROW EXECUTE FUNCTION create_recruiter_reconnect_reminder();

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to calculate Fast-Track Score (0-100)
CREATE OR REPLACE FUNCTION calculate_fast_track_score(p_user_id UUID, p_week_start DATE)
RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_companies_shortlisted INTEGER;
    v_applications_submitted INTEGER;
    v_referrals_obtained INTEGER;
    v_recruiters_contacted INTEGER;
    v_networking_meetings INTEGER;
BEGIN
    -- Get metrics for the week
    SELECT
        companies_shortlisted,
        applications_submitted,
        referrals_obtained,
        recruiters_contacted,
        networking_meetings_held
    INTO
        v_companies_shortlisted,
        v_applications_submitted,
        v_referrals_obtained,
        v_recruiters_contacted,
        v_networking_meetings
    FROM fast_track_metrics
    WHERE user_id = p_user_id AND metric_week_start = p_week_start;

    -- Calculate score (max 100)
    -- Step 1: Companies shortlisted (max 20 points: 2 points per company, max 10 companies)
    v_score := v_score + LEAST(v_companies_shortlisted * 2, 20);

    -- Step 2: Applications with referrals (max 30 points: 15 points per referral, max 2)
    v_score := v_score + LEAST(v_referrals_obtained * 15, 30);

    -- Step 3: Recruiters contacted (max 20 points: 4 points per recruiter, max 5)
    v_score := v_score + LEAST(v_recruiters_contacted * 4, 20);

    -- Step 4: Networking meetings (max 30 points: 10 points per meeting, max 3)
    v_score := v_score + LEAST(v_networking_meetings * 10, 30);

    RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- INITIALIZATION DATA
-- ========================================

-- Pre-populate 60-Day Networking Plan goals from workbook
CREATE OR REPLACE FUNCTION initialize_60day_networking_plan(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO networking_60day_plan (user_id, week_number, goals, completed) VALUES
    (p_user_id, 1, 'Identify 20 contacts (LinkedIn + existing network). Reach out to 5.', FALSE),
    (p_user_id, 2, 'Schedule 2 informational meetings. Draft/refine your 90-sec intro.', FALSE),
    (p_user_id, 3, 'Follow up with 5 contacts. Share your résumé with 1 trusted contact for feedback.', FALSE),
    (p_user_id, 4, 'Add 5 new connections through referrals. Attend 1 networking event (virtual or in person).', FALSE),
    (p_user_id, 5, 'Reconnect with 3 dormant contacts (people you haven''t spoken to in 6+ months).', FALSE),
    (p_user_id, 6, 'Schedule 3 more informational meetings. Post or comment meaningfully on LinkedIn.', FALSE),
    (p_user_id, 7, 'Follow up with earlier meetings. Ask for introductions: "Who else should I talk to?"', FALSE),
    (p_user_id, 8, 'Add 5 more contacts. Do a personal reflection: how many people now know your story?', FALSE)
    ON CONFLICT (user_id, week_number) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- SUCCESS MESSAGE
-- ========================================

DO $$
BEGIN
    RAISE NOTICE '✅ Fast-Track Job Search System™ tables created successfully!';
    RAISE NOTICE '📊 Created 13 core tables + support functions';
    RAISE NOTICE '🔒 RLS policies enabled on all tables';
    RAISE NOTICE '⚡ Auto-reminders and triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 NEXT STEPS:';
    RAISE NOTICE '1. Run this SQL in Supabase SQL Editor';
    RAISE NOTICE '2. Verify tables created: Check Table Editor';
    RAISE NOTICE '3. Initialize your 60-day plan: SELECT initialize_60day_networking_plan(auth.uid());';
    RAISE NOTICE '4. Start using the Fast-Track system!';
END $$;
