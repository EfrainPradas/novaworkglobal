-- ========================================
-- FIX RLS POLICIES FOR FAST-TRACK TABLES
-- Run this if you're getting 406 or 400 errors
-- ========================================

-- 1. TARGET COMPANY CRITERIA
DROP POLICY IF EXISTS "Users can view their own target criteria" ON target_company_criteria;
DROP POLICY IF EXISTS "Users can insert their own target criteria" ON target_company_criteria;
DROP POLICY IF EXISTS "Users can update their own target criteria" ON target_company_criteria;
DROP POLICY IF EXISTS "Users can delete their own target criteria" ON target_company_criteria;

CREATE POLICY "Users can view their own target criteria"
ON target_company_criteria FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own target criteria"
ON target_company_criteria FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own target criteria"
ON target_company_criteria FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own target criteria"
ON target_company_criteria FOR DELETE
USING (auth.uid() = user_id);

-- 2. INDUSTRY RESEARCH
DROP POLICY IF EXISTS "Users can view their own industry research" ON industry_research;
DROP POLICY IF EXISTS "Users can insert their own industry research" ON industry_research;
DROP POLICY IF EXISTS "Users can update their own industry research" ON industry_research;
DROP POLICY IF EXISTS "Users can delete their own industry research" ON industry_research;

CREATE POLICY "Users can view their own industry research"
ON industry_research FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own industry research"
ON industry_research FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own industry research"
ON industry_research FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own industry research"
ON industry_research FOR DELETE
USING (auth.uid() = user_id);

-- 3. COMPANY SHORTLIST
DROP POLICY IF EXISTS "Users can view their own company shortlist" ON company_shortlist;
DROP POLICY IF EXISTS "Users can insert their own company shortlist" ON company_shortlist;
DROP POLICY IF EXISTS "Users can update their own company shortlist" ON company_shortlist;
DROP POLICY IF EXISTS "Users can delete their own company shortlist" ON company_shortlist;

CREATE POLICY "Users can view their own company shortlist"
ON company_shortlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own company shortlist"
ON company_shortlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own company shortlist"
ON company_shortlist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own company shortlist"
ON company_shortlist FOR DELETE
USING (auth.uid() = user_id);

-- 4. JOB APPLICATIONS (already exists but verify)
DROP POLICY IF EXISTS "Users can view their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can insert their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can update their own job applications" ON job_applications;
DROP POLICY IF EXISTS "Users can delete their own job applications" ON job_applications;

CREATE POLICY "Users can view their own job applications"
ON job_applications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job applications"
ON job_applications FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job applications"
ON job_applications FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job applications"
ON job_applications FOR DELETE
USING (auth.uid() = user_id);

-- 5. RESUME TAILORING CHECKLIST
DROP POLICY IF EXISTS "Users can view their own checklist" ON resume_tailoring_checklist;
DROP POLICY IF EXISTS "Users can insert their own checklist" ON resume_tailoring_checklist;
DROP POLICY IF EXISTS "Users can update their own checklist" ON resume_tailoring_checklist;
DROP POLICY IF EXISTS "Users can delete their own checklist" ON resume_tailoring_checklist;

CREATE POLICY "Users can view their own checklist"
ON resume_tailoring_checklist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checklist"
ON resume_tailoring_checklist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own checklist"
ON resume_tailoring_checklist FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own checklist"
ON resume_tailoring_checklist FOR DELETE
USING (auth.uid() = user_id);

-- 6. RECRUITERS
DROP POLICY IF EXISTS "Users can view their own recruiters" ON recruiters;
DROP POLICY IF EXISTS "Users can insert their own recruiters" ON recruiters;
DROP POLICY IF EXISTS "Users can update their own recruiters" ON recruiters;
DROP POLICY IF EXISTS "Users can delete their own recruiters" ON recruiters;

CREATE POLICY "Users can view their own recruiters"
ON recruiters FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recruiters"
ON recruiters FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recruiters"
ON recruiters FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recruiters"
ON recruiters FOR DELETE
USING (auth.uid() = user_id);

-- 7. RECRUITER INTERACTIONS
DROP POLICY IF EXISTS "Users can view their own recruiter interactions" ON recruiter_interactions;
DROP POLICY IF EXISTS "Users can insert their own recruiter interactions" ON recruiter_interactions;
DROP POLICY IF EXISTS "Users can update their own recruiter interactions" ON recruiter_interactions;
DROP POLICY IF EXISTS "Users can delete their own recruiter interactions" ON recruiter_interactions;

CREATE POLICY "Users can view their own recruiter interactions"
ON recruiter_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recruiter interactions"
ON recruiter_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recruiter interactions"
ON recruiter_interactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recruiter interactions"
ON recruiter_interactions FOR DELETE
USING (auth.uid() = user_id);

-- 8. NETWORKING CONTACTS
DROP POLICY IF EXISTS "Users can view their own contacts" ON networking_contacts;
DROP POLICY IF EXISTS "Users can insert their own contacts" ON networking_contacts;
DROP POLICY IF EXISTS "Users can update their own contacts" ON networking_contacts;
DROP POLICY IF EXISTS "Users can delete their own contacts" ON networking_contacts;

CREATE POLICY "Users can view their own contacts"
ON networking_contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
ON networking_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
ON networking_contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
ON networking_contacts FOR DELETE
USING (auth.uid() = user_id);

-- 9. NETWORKING INTERACTIONS
DROP POLICY IF EXISTS "Users can view their own interactions" ON networking_interactions;
DROP POLICY IF EXISTS "Users can insert their own interactions" ON networking_interactions;
DROP POLICY IF EXISTS "Users can update their own interactions" ON networking_interactions;
DROP POLICY IF EXISTS "Users can delete their own interactions" ON networking_interactions;

CREATE POLICY "Users can view their own interactions"
ON networking_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interactions"
ON networking_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions"
ON networking_interactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
ON networking_interactions FOR DELETE
USING (auth.uid() = user_id);

-- 10. NETWORKING 60-DAY PLAN
DROP POLICY IF EXISTS "Users can view their own plan" ON networking_60day_plan;
DROP POLICY IF EXISTS "Users can insert their own plan" ON networking_60day_plan;
DROP POLICY IF EXISTS "Users can update their own plan" ON networking_60day_plan;
DROP POLICY IF EXISTS "Users can delete their own plan" ON networking_60day_plan;

CREATE POLICY "Users can view their own plan"
ON networking_60day_plan FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plan"
ON networking_60day_plan FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plan"
ON networking_60day_plan FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plan"
ON networking_60day_plan FOR DELETE
USING (auth.uid() = user_id);

-- 11. USER 90-SECOND INTRO
DROP POLICY IF EXISTS "Users can view their own intro" ON user_90_second_intro;
DROP POLICY IF EXISTS "Users can insert their own intro" ON user_90_second_intro;
DROP POLICY IF EXISTS "Users can update their own intro" ON user_90_second_intro;
DROP POLICY IF EXISTS "Users can delete their own intro" ON user_90_second_intro;

CREATE POLICY "Users can view their own intro"
ON user_90_second_intro FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own intro"
ON user_90_second_intro FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own intro"
ON user_90_second_intro FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own intro"
ON user_90_second_intro FOR DELETE
USING (auth.uid() = user_id);

-- 12. AUTO REMINDERS
DROP POLICY IF EXISTS "Users can view their own reminders" ON auto_reminders;
DROP POLICY IF EXISTS "Users can insert their own reminders" ON auto_reminders;
DROP POLICY IF EXISTS "Users can update their own reminders" ON auto_reminders;
DROP POLICY IF EXISTS "Users can delete their own reminders" ON auto_reminders;

CREATE POLICY "Users can view their own reminders"
ON auto_reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders"
ON auto_reminders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
ON auto_reminders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
ON auto_reminders FOR DELETE
USING (auth.uid() = user_id);

-- 13. FAST TRACK METRICS
DROP POLICY IF EXISTS "Users can view their own metrics" ON fast_track_metrics;
DROP POLICY IF EXISTS "Users can insert their own metrics" ON fast_track_metrics;
DROP POLICY IF EXISTS "Users can update their own metrics" ON fast_track_metrics;
DROP POLICY IF EXISTS "Users can delete their own metrics" ON fast_track_metrics;

CREATE POLICY "Users can view their own metrics"
ON fast_track_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON fast_track_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON fast_track_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
ON fast_track_metrics FOR DELETE
USING (auth.uid() = user_id);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ All RLS Policies Fixed!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'You should now be able to:';
    RAISE NOTICE '- View/insert/update/delete in all Fast-Track tables';
    RAISE NOTICE '- Save Target Company Criteria';
    RAISE NOTICE '- Save Industry Research';
    RAISE NOTICE '- Save Company Shortlist';
    RAISE NOTICE '';
    RAISE NOTICE 'Refresh your browser and try again!';
END $$;
