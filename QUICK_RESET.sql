-- ===============================================
-- RESETEAR ONBOARDING - SIMPLE Y DIRECTO
-- Usuario: 02c3711e-0da5-4077-8687-ae0892884ef9
-- ===============================================

-- Copia y pega este bloque completo en Supabase SQL Editor y haz clic en "Run"

DO $$
DECLARE
  v_user_id UUID := '02c3711e-0da5-4077-8687-ae0892884ef9';
BEGIN
  -- 1. Resetear flag de onboarding completado
  UPDATE user_profiles 
  SET onboarding_completed = false 
  WHERE user_id = v_user_id;
  
  -- 2. Eliminar respuestas anteriores
  DELETE FROM onboarding_responses WHERE user_id = v_user_id;
  DELETE FROM user_skills WHERE user_id = v_user_id;
  DELETE FROM user_interests WHERE user_id = v_user_id;
  DELETE FROM user_values WHERE user_id = v_user_id;
  
  -- Mensaje de confirmación
  RAISE NOTICE '✅ Usuario reseteado! Ve a /onboarding para empezar de nuevo.';
END $$;
