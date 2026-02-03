-- ========================================
-- DROP ALL FAST-TRACK SYSTEM TABLES
-- ⚠️  WARNING: This will DELETE ALL DATA in these tables!
-- Only run this if you want to start fresh
-- ========================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS fast_track_metrics CASCADE;
DROP TABLE IF EXISTS auto_reminders CASCADE;
DROP TABLE IF EXISTS user_90_second_intro CASCADE;
DROP TABLE IF EXISTS networking_60day_plan CASCADE;
DROP TABLE IF EXISTS networking_interactions CASCADE;
DROP TABLE IF EXISTS networking_contacts CASCADE;
DROP TABLE IF EXISTS recruiter_interactions CASCADE;
DROP TABLE IF EXISTS recruiters CASCADE;
DROP TABLE IF EXISTS resume_tailoring_checklist CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS company_shortlist CASCADE;
DROP TABLE IF EXISTS industry_research CASCADE;
DROP TABLE IF NOT EXISTS target_company_criteria CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_target_company_criteria_updated_at ON target_company_criteria;
DROP TRIGGER IF EXISTS update_industry_research_updated_at ON industry_research;
DROP TRIGGER IF EXISTS update_company_shortlist_updated_at ON company_shortlist;
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
DROP TRIGGER IF EXISTS update_resume_tailoring_checklist_updated_at ON resume_tailoring_checklist;
DROP TRIGGER IF EXISTS update_recruiters_updated_at ON recruiters;
DROP TRIGGER IF EXISTS update_networking_contacts_updated_at ON networking_contacts;
DROP TRIGGER IF EXISTS update_networking_60day_plan_updated_at ON networking_60day_plan;
DROP TRIGGER IF EXISTS update_user_90_second_intro_updated_at ON user_90_second_intro;
DROP TRIGGER IF EXISTS job_application_auto_follow_up ON job_applications;
DROP TRIGGER IF EXISTS recruiter_auto_reconnect ON recruiters;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_job_application_follow_up() CASCADE;
DROP FUNCTION IF EXISTS create_recruiter_reconnect_reminder() CASCADE;
DROP FUNCTION IF EXISTS calculate_fast_track_score(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS initialize_60day_networking_plan(UUID) CASCADE;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All Fast-Track System tables DROPPED!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You can now run CREATE_FAST_TRACK_SYSTEM_TABLES.sql to recreate everything.';
END $$;
