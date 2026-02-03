-- Script para resetear el onboarding de un usuario en Supabase
-- Ejecuta esto en Supabase SQL Editor

-- Encuentra tu user_id
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- Reemplaza 'TU_USER_ID' con tu ID real
UPDATE user_profiles 
SET onboarding_completed = false 
WHERE user_id = 'TU_USER_ID';

-- Opcional: Eliminar respuestas anteriores para empezar limpio
DELETE FROM onboarding_responses WHERE user_id = 'TU_USER_ID';
