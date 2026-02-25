
-- ============================================================================
-- SCRIPT PARA INSERTAR DATOS DE EJEMPLO (SEED DATA)
-- Basado en la captura de pantalla de "Online Job Applications"
-- ============================================================================
-- Instrucciones:
-- 1. Reemplaza 'tu_email_aqui@ejemplo.com' con el email de tu usuario real.
-- 2. Ejecuta este script en el editor SQL de Supabase.

WITH target_user AS (
    SELECT id FROM users WHERE email = 'tu_email_aqui@ejemplo.com' LIMIT 1
)
INSERT INTO job_applications (
    user_id,
    job_title,
    company,
    application_status,
    match_score,
    date_applied,
    where_found,
    date_found,
    link_to_posting,
    top_keywords
)
SELECT 
    id as user_id,
    job_title,
    company,
    status as application_status,
    score as match_score,
    app_date as date_applied,
    'LinkedIn' as where_found,
    app_date as date_found,
    'https://linkedin.com/jobs' as link_to_posting,
    ARRAY['React', 'TypeScript', 'Node.js'] as top_keywords
FROM target_user, (VALUES
    ('Software Engineer / VB.NET / Open to Remote', 'Motion Recruitment', 'applied', 80, '2024-02-17'::date),
    ('Software Engineer 2 (Telework Available)', 'Wyetech', 'applied', 33, '2024-02-17'::date),
    ('Software Engineer (Enterprise Product, Observability; Remote)', 'Dagster Labs', 'tailoring', 93, '2024-01-26'::date),
    ('Data Analytics Engineer', 'Zions Bank', 'tailoring', 93, '2024-01-26'::date),
    ('Remote Senior Software Developer', 'Global Channel Management', 'tailoring', 73, '2024-01-26'::date),
    ('(Remote) Software Engineer - Web App Integrations', 'Harris Computer', 'tailoring', 80, '2024-01-26'::date),
    ('Sr. Software Engineer- REMOTE Opportunity', 'HERS Advisors', 'tailoring', 100, '2024-01-26'::date)
) AS data(job_title, company, status, score, app_date)
WHERE EXISTS (SELECT 1 FROM target_user);

-- Verificar la inserción
SELECT job_title, company, application_status, match_score FROM job_applications 
WHERE user_id = (SELECT id FROM users WHERE email = 'tu_email_aqui@ejemplo.com');
