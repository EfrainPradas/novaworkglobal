-- ============================================
-- AUTO-ASSIGN INTERVIEW ANSWERS FUNCTION
-- CareerTipsAI 2025
-- ============================================
-- This function automatically assigns sample interview answers
-- to users based on their target job title / profession
-- ============================================

-- Function to map target job titles to job profiles
CREATE OR REPLACE FUNCTION get_job_profile_from_title(job_title TEXT)
RETURNS TEXT AS $$
DECLARE
    normalized_title TEXT;
BEGIN
    normalized_title := LOWER(TRIM(job_title));
    
    -- Data Analyst / BI profiles
    IF normalized_title ILIKE '%data analyst%' 
        OR normalized_title ILIKE '%business analyst%'
        OR normalized_title ILIKE '%bi analyst%'
        OR normalized_title ILIKE '%business intelligence%'
        OR normalized_title ILIKE '%data engineer%'
        OR normalized_title ILIKE '%analytics%'
        OR normalized_title ILIKE '%power bi%'
        OR normalized_title ILIKE '%tableau%'
        OR normalized_title ILIKE '%sql%' THEN
        RETURN 'Data Analyst';
    
    -- Software Engineer profiles
    ELSIF normalized_title ILIKE '%software engineer%'
        OR normalized_title ILIKE '%developer%'
        OR normalized_title ILIKE '%programmer%'
        OR normalized_title ILIKE '%frontend%'
        OR normalized_title ILIKE '%backend%'
        OR normalized_title ILIKE '%full stack%'
        OR normalized_title ILIKE '%fullstack%' THEN
        RETURN 'Software Engineer';
    
    -- Project Manager profiles
    ELSIF normalized_title ILIKE '%project manager%'
        OR normalized_title ILIKE '%scrum master%'
        OR normalized_title ILIKE '%agile%'
        OR normalized_title ILIKE '%pmo%' THEN
        RETURN 'Project Manager';
    
    -- Product Manager profiles
    ELSIF normalized_title ILIKE '%product manager%'
        OR normalized_title ILIKE '%product owner%' THEN
        RETURN 'Product Manager';
    
    -- Manager/Director profiles
    ELSIF normalized_title ILIKE '%manager%'
        OR normalized_title ILIKE '%director%'
        OR normalized_title ILIKE '%head of%'
        OR normalized_title ILIKE '%lead%' THEN
        RETURN 'Manager';
    
    -- Default to a general profile
    ELSE
        RETURN 'General';
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Function to copy sample answers to user's answer bank
-- ============================================
CREATE OR REPLACE FUNCTION assign_sample_answers_to_user(
    p_user_id UUID,
    p_job_title TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_job_profile TEXT;
    v_count INTEGER := 0;
BEGIN
    -- Get the job profile for this title
    v_job_profile := get_job_profile_from_title(p_job_title);
    
    -- Insert sample answers as user's prepared answers
    INSERT INTO interview_question_answers (
        user_id,
        question_id,
        answer_text,
        confidence_level,
        needs_improvement,
        improvement_notes
    )
    SELECT 
        p_user_id,
        sa.question_id,
        sa.sample_answer,
        3, -- Default confidence level (medium)
        TRUE, -- Needs personalization
        'This is a sample answer based on your profession (' || v_job_profile || '). Please personalize it with your own experiences and specific examples.'
    FROM interview_sample_answers sa
    WHERE sa.job_profile = v_job_profile
    AND NOT EXISTS (
        -- Don't insert if user already has an answer for this question
        SELECT 1 FROM interview_question_answers qa 
        WHERE qa.user_id = p_user_id 
        AND qa.question_id = sa.question_id
    );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger function to auto-assign on onboarding completion
-- ============================================
CREATE OR REPLACE FUNCTION trigger_assign_interview_answers()
RETURNS TRIGGER AS $$
DECLARE
    v_job_title TEXT;
    v_count INTEGER;
BEGIN
    -- Only trigger when onboarding_completed changes to TRUE
    IF NEW.onboarding_completed = TRUE AND (OLD.onboarding_completed IS NULL OR OLD.onboarding_completed = FALSE) THEN
        
        -- Get the target job title
        v_job_title := COALESCE(NEW.target_job_title, '');
        
        IF v_job_title != '' THEN
            -- Assign sample answers
            v_count := assign_sample_answers_to_user(NEW.user_id, v_job_title);
            
            RAISE NOTICE 'Assigned % sample interview answers to user % for job title: %', 
                v_count, NEW.user_id, v_job_title;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Create the trigger on user_profiles
-- ============================================
DROP TRIGGER IF EXISTS auto_assign_interview_answers ON user_profiles;

CREATE TRIGGER auto_assign_interview_answers
    AFTER UPDATE OF onboarding_completed ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_assign_interview_answers();

-- ============================================
-- Manual function to assign answers to existing users
-- Call this for users who already completed onboarding
-- ============================================
CREATE OR REPLACE FUNCTION backfill_interview_answers_for_existing_users()
RETURNS TABLE(user_id UUID, job_title TEXT, answers_assigned INTEGER) AS $$
DECLARE
    r RECORD;
    v_count INTEGER;
BEGIN
    FOR r IN 
        SELECT up.user_id, up.target_job_title
        FROM user_profiles up
        WHERE up.onboarding_completed = TRUE
        AND up.target_job_title IS NOT NULL
        AND up.target_job_title != ''
    LOOP
        v_count := assign_sample_answers_to_user(r.user_id, r.target_job_title);
        
        IF v_count > 0 THEN
            user_id := r.user_id;
            job_title := r.target_job_title;
            answers_assigned := v_count;
            RETURN NEXT;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================
SELECT '✅ Auto-assign interview answers functions created!' as status;

-- Test the job profile function
SELECT 
    'Data Analyst' as input,
    get_job_profile_from_title('Data Analyst') as profile
UNION ALL
SELECT 
    'Senior Software Engineer',
    get_job_profile_from_title('Senior Software Engineer')
UNION ALL
SELECT 
    'Project Manager',
    get_job_profile_from_title('Project Manager')
UNION ALL
SELECT 
    'Business Intelligence Developer',
    get_job_profile_from_title('Business Intelligence Developer');

-- ============================================
-- USAGE INSTRUCTIONS
-- ============================================
-- 
-- 1. This trigger will AUTOMATICALLY assign sample answers when
--    a user completes onboarding (onboarding_completed = TRUE)
--
-- 2. To manually assign answers to a specific user:
--    SELECT assign_sample_answers_to_user('user-uuid-here', 'Data Analyst');
--
-- 3. To backfill answers for all existing users who already completed onboarding:
--    SELECT * FROM backfill_interview_answers_for_existing_users();
--
-- ============================================
