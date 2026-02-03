-- ⚠️ DANGER: This script wipes ALL user data from the application tables.
-- It is intended for resetting the environment for fresh testing.
-- Run this in the Supabase SQL Editor.

BEGIN;

-- 1. Disable triggers to speed up deletion
SET session_replication_role = 'replica';

-- 2. TRUNCATE all public tables that contain user data
-- We use CASCADE to handle foreign key dependencies automatically
RAISE NOTICE '🗑️ Deleting all user data...';

TRUNCATE TABLE 
  -- Core Profile & Auth
  user_profiles,
  onboarding_responses,
  subscriptions,
  ai_cost_tracking,
  activity_logs,
  
  -- Career Vision & Preferences
  career_vision_profiles,
  ideal_work_preferences,
  user_skills,
  user_interests,
  user_values,
  competencies,
  badges,
  user_badges,
  
  -- Resume Builder
  resumes,
  user_resumes,
  tailored_resumes,
  resume_versions,
  work_experience,
  education,
  certifications,
  par_stories,
  par_accomplishments,
  accomplishments,
  job_history_analysis,
  
  -- Job Search Planning & Strategy
  job_search_plan,
  job_searches,
  jobs,
  roles,
  company_shortlist,
  target_company_criteria,
  industry_research,
  networking_60day_plan,
  user_90_second_intro,
  
  -- Applications & Tracking
  job_applications,
  resume_tailoring_checklist,
  job_description_analysis,
  jd_comparison_analysis,
  
  -- Networking
  networking_contacts,
  networking_interactions,
  recruiters,
  recruiter_interactions,
  thank_you_notes,
  
  -- Interviews
  interviews,
  interview_questions,
  interview_question_answers,
  interview_preparations,
  interview_research,
  interview_negotiation_prep,
  interview_session_notes,
  interview_practice_sessions,
  interview_followups,
  mock_interviews,
  
  -- Weekly Reinvention & Habits
  weekly_goals,
  weekly_progress,
  weekly_reflections,
  daily_tasks,
  auto_reminders,
  journal_entries,
  
  -- Other / Utils
  user_content_translations,
  learning_paths,
  fast_track_metrics

CASCADE;

-- 3. Reset sequences if necessary (optional)
-- ALTER SEQUENCE table_id_seq RESTART WITH 1;

RAISE NOTICE '✅ All application data has been wiped.';

-- 4. Restore triggers
SET session_replication_role = 'origin';

COMMIT;
