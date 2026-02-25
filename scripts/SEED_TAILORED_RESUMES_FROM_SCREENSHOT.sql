
-- ============================================================================
-- SCRIPT PARA INSERTAR DATOS DE EJEMPLO EN TAILORED_RESUMES
-- Basado en la captura de pantalla de "My Resumes" tab
-- ============================================================================
-- Instrucciones:
-- 1. Reemplaza 'tu_email_aqui@ejemplo.com' con el email de tu usuario real.
-- 2. Ejecuta este script en el editor SQL de Supabase.

WITH target_user AS (
    SELECT id FROM users WHERE email = 'tu_email_aqui@ejemplo.com' LIMIT 1
)
INSERT INTO tailored_resumes (
    user_id,
    job_title,
    company_name,
    application_status,
    match_score,
    sent_at,
    interview_date,
    created_at
)
SELECT 
    id as user_id,
    job_title,
    company_name,
    status as application_status,
    score as match_score,
    sent_date as sent_at,
    interview_date,
    NOW() as created_at
FROM target_user, (VALUES
    ('Software Engineer / VB.NET / Open to Remote', 'Motion Recruitment', 'interview_scheduled', 80, '2024-02-17'::timestamptz, '2024-02-19'::timestamptz),
    ('Software Engineer 2 (Telework Available)', 'Wyetech', 'rejected', 33, '2024-02-17'::timestamptz, '2024-02-21'::timestamptz),
    ('Software Engineer (Enterprise Product, Observability; Remote)', 'Dagster Labs', 'interviewed', 93, '2024-01-26'::timestamptz, '2024-02-20'::timestamptz),
    ('Data Analytics Engineer', 'Zions Bank', 'under_review', 93, '2024-01-26'::timestamptz, '2024-02-25'::timestamptz),
    ('Remote Senior Software Developer', 'Global Channel Management', 'draft', 73, '2024-01-26'::timestamptz, NULL),
    ('(Remote) Software Engineer - Web App Integrations', 'Harris Computer', 'draft', 80, '2024-01-26'::timestamptz, NULL)
) AS data(job_title, company_name, status, score, sent_date, interview_date)
WHERE EXISTS (SELECT 1 FROM target_user);

-- Verificar la inserción
SELECT job_title, company_name, application_status, match_score 
FROM tailored_resumes 
WHERE user_id = (SELECT id FROM users WHERE email = 'tu_email_aqui@ejemplo.com');
