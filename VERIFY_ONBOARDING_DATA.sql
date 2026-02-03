-- ===============================================
-- VERIFICACIÓN COMPLETA DE DATOS DE ONBOARDING
-- Usuario: 02c3711e-0da5-4077-8687-ae0892884ef9
-- ===============================================

-- Definir el user_id como variable
DO $$ 
DECLARE
    v_user_id UUID := '02c3711e-0da5-4077-8687-ae0892884ef9';
BEGIN
    RAISE NOTICE '🔍 Verificando datos para user_id: %', v_user_id;
END $$;

-- ===============================================
-- 📋 DATOS EN onboarding_responses
-- ===============================================
SELECT 
    '✅ ONBOARDING RESPONSES' as seccion,
    target_job_title as "Job Title",
    current_location as "Location",
    skills as "Skills (JSONB)",
    interests as "Interests (JSONB)",
    values as "Values (JSONB)",
    values_reasoning as "Values Reasoning",
    created_at as "Fecha de Completado"
FROM onboarding_responses 
WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9'
ORDER BY created_at DESC
LIMIT 1;

-- ===============================================
-- 🎯 SKILLS INDIVIDUALES (tabla normalizada)
-- ===============================================
SELECT 
    '✅ USER SKILLS' as seccion,
    skill_name as "Skill",
    source as "Source",
    created_at as "Agregado el"
FROM user_skills 
WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9'
ORDER BY created_at ASC;

-- ===============================================
-- 💡 INTERESTS INDIVIDUALES (tabla normalizada)
-- ===============================================
SELECT 
    '✅ USER INTERESTS' as seccion,
    interest_name as "Interest",
    source as "Source",
    created_at as "Agregado el"
FROM user_interests 
WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9'
ORDER BY created_at ASC;

-- ===============================================
-- ❤️ VALUES INDIVIDUALES (tabla normalizada)
-- ===============================================
SELECT 
    '✅ USER VALUES' as seccion,
    value_label as "Value",
    value_id as "ID",
    reasoning as "Reasoning",
    created_at as "Agregado el"
FROM user_values 
WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9'
ORDER BY created_at ASC;

-- ===============================================
-- 📊 RESUMEN CUANTITATIVO
-- ===============================================
SELECT 
    '📊 RESUMEN' as seccion,
    (SELECT COUNT(*) FROM user_skills WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9') as "Total Skills",
    (SELECT COUNT(*) FROM user_interests WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9') as "Total Interests",
    (SELECT COUNT(*) FROM user_values WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9') as "Total Values",
    (SELECT COUNT(*) FROM onboarding_responses WHERE user_id = '02c3711e-0da5-4077-8687-ae0892884ef9') as "Onboarding Completado";

-- ===============================================
-- ✅ CHECKLIST DE VERIFICACIÓN
-- ===============================================
-- Deberías ver:
-- 1. ✅ Datos en onboarding_responses (target_job_title, location, skills JSONB, etc.)
-- 2. ✅ Al menos 3 skills en user_skills
-- 3. ✅ Al menos 3 interests en user_interests  
-- 4. ✅ Entre 3-5 values en user_values
-- 5. ✅ Resumen mostrando cantidades correctas

-- Si ves 0 en alguna tabla, puede haber un error en el guardado
-- o las tablas no se crearon correctamente
