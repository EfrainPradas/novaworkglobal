-- ========================================
-- FAST-TRACK SYSTEM VERIFICATION SCRIPT
-- Run this AFTER executing CREATE_FAST_TRACK_SYSTEM_TABLES.sql
-- ========================================

-- Check if all 13 tables were created
SELECT
    'Tables Created:' AS check_type,
    COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'target_company_criteria',
    'industry_research',
    'company_shortlist',
    'job_applications',
    'resume_tailoring_checklist',
    'recruiters',
    'recruiter_interactions',
    'networking_contacts',
    'networking_interactions',
    'networking_60day_plan',
    'user_90_second_intro',
    'auto_reminders',
    'fast_track_metrics'
);

-- Expected result: 13 tables

-- List all Fast-Track tables with row counts
SELECT
    schemaname,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'target_company_criteria',
    'industry_research',
    'company_shortlist',
    'job_applications',
    'resume_tailoring_checklist',
    'recruiters',
    'recruiter_interactions',
    'networking_contacts',
    'networking_interactions',
    'networking_60day_plan',
    'user_90_second_intro',
    'auto_reminders',
    'fast_track_metrics'
)
ORDER BY tablename;

-- Check RLS is enabled on all tables
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'target_company_criteria',
    'industry_research',
    'company_shortlist',
    'job_applications',
    'resume_tailoring_checklist',
    'recruiters',
    'recruiter_interactions',
    'networking_contacts',
    'networking_interactions',
    'networking_60day_plan',
    'user_90_second_intro',
    'auto_reminders',
    'fast_track_metrics'
)
ORDER BY tablename;

-- Expected: All should have rls_enabled = true

-- Check indexes created
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
    'target_company_criteria',
    'industry_research',
    'company_shortlist',
    'job_applications',
    'resume_tailoring_checklist',
    'recruiters',
    'recruiter_interactions',
    'networking_contacts',
    'networking_interactions',
    'networking_60day_plan',
    'user_90_second_intro',
    'auto_reminders',
    'fast_track_metrics'
)
ORDER BY tablename, indexname;

-- Check triggers created
SELECT
    event_object_table AS table_name,
    trigger_name,
    event_manipulation AS trigger_event,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN (
    'target_company_criteria',
    'industry_research',
    'company_shortlist',
    'job_applications',
    'resume_tailoring_checklist',
    'recruiters',
    'recruiter_interactions',
    'networking_contacts',
    'networking_interactions',
    'networking_60day_plan',
    'user_90_second_intro'
)
ORDER BY table_name, trigger_name;

-- Check helper functions exist
SELECT
    routine_name AS function_name,
    routine_type,
    data_type AS return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'update_updated_at_column',
    'create_job_application_follow_up',
    'create_recruiter_reconnect_reminder',
    'calculate_fast_track_score',
    'initialize_60day_networking_plan'
)
ORDER BY routine_name;

-- Expected: 5 functions

-- Test: Initialize 60-day plan for current user
-- UNCOMMENT THIS LINE AFTER VERIFYING ABOVE:
-- SELECT initialize_60day_networking_plan(auth.uid());

-- Test: Check if 60-day plan was created
-- UNCOMMENT THIS LINE AFTER RUNNING THE FUNCTION:
-- SELECT * FROM networking_60day_plan WHERE user_id = auth.uid() ORDER BY week_number;

-- Expected: 8 rows (Week 1-8)

-- ========================================
-- SUMMARY CHECK
-- ========================================

DO $$
DECLARE
    v_table_count INTEGER;
    v_function_count INTEGER;
    v_rls_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO v_table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
        'target_company_criteria', 'industry_research', 'company_shortlist',
        'job_applications', 'resume_tailoring_checklist', 'recruiters',
        'recruiter_interactions', 'networking_contacts', 'networking_interactions',
        'networking_60day_plan', 'user_90_second_intro', 'auto_reminders',
        'fast_track_metrics'
    );

    -- Count functions
    SELECT COUNT(*) INTO v_function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
    AND routine_name IN (
        'update_updated_at_column', 'create_job_application_follow_up',
        'create_recruiter_reconnect_reminder', 'calculate_fast_track_score',
        'initialize_60day_networking_plan'
    );

    -- Count RLS enabled tables
    SELECT COUNT(*) INTO v_rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND rowsecurity = true
    AND tablename IN (
        'target_company_criteria', 'industry_research', 'company_shortlist',
        'job_applications', 'resume_tailoring_checklist', 'recruiters',
        'recruiter_interactions', 'networking_contacts', 'networking_interactions',
        'networking_60day_plan', 'user_90_second_intro', 'auto_reminders',
        'fast_track_metrics'
    );

    -- Display results
    RAISE NOTICE '========================================';
    RAISE NOTICE 'FAST-TRACK SYSTEM VERIFICATION RESULTS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables Created: % / 13 %', v_table_count,
        CASE WHEN v_table_count = 13 THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'Helper Functions: % / 5 %', v_function_count,
        CASE WHEN v_function_count = 5 THEN '✅' ELSE '❌' END;
    RAISE NOTICE 'RLS Enabled: % / 13 %', v_rls_count,
        CASE WHEN v_rls_count = 13 THEN '✅' ELSE '❌' END;
    RAISE NOTICE '';

    IF v_table_count = 13 AND v_function_count = 5 AND v_rls_count = 13 THEN
        RAISE NOTICE '🎉 SUCCESS! Fast-Track System is fully installed!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 NEXT STEPS:';
        RAISE NOTICE '1. Initialize your 60-day plan: SELECT initialize_60day_networking_plan(auth.uid());';
        RAISE NOTICE '2. Verify plan created: SELECT * FROM networking_60day_plan WHERE user_id = auth.uid();';
        RAISE NOTICE '3. Start building the frontend!';
    ELSE
        RAISE NOTICE '⚠️  INCOMPLETE INSTALLATION';
        RAISE NOTICE 'Please check the details above and re-run CREATE_FAST_TRACK_SYSTEM_TABLES.sql';
    END IF;

    RAISE NOTICE '========================================';
END $$;
