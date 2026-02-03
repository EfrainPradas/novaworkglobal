-- PASO 1: Encuentra tu user_id actual (copia el resultado)
-- Este query te mostrará tu email y user_id
SELECT id as user_id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- PASO 2: Copia el user_id de tu usuario y reemplaza 'PEGA_TU_USER_ID_AQUI' abajo
-- Luego ejecuta este bloque completo:

DO $$
DECLARE
  v_user_id UUID := 'PEGA_TU_USER_ID_AQUI'; -- ⬅️ REEMPLAZA ESTO CON TU USER_ID
BEGIN
  -- 1. Resetear el flag de onboarding completado
  UPDATE user_profiles 
  SET onboarding_completed = false 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Onboarding flag reseteado';

  -- 2. Eliminar respuestas de onboarding anteriores
  DELETE FROM onboarding_responses 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Respuestas de onboarding eliminadas';

  -- 3. Eliminar skills previos (si existen las tablas)
  DELETE FROM user_skills 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Skills eliminados';

  -- 4. Eliminar interests previos (si existen las tablas)
  DELETE FROM user_interests 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Interests eliminados';

  -- 5. Eliminar values previos (si existen las tablas)
  DELETE FROM user_values 
  WHERE user_id = v_user_id;
  
  RAISE NOTICE '✅ Values eliminados';

  -- Resumen
  RAISE NOTICE '===================================';
  RAISE NOTICE '🎉 Usuario reseteado exitosamente!';
  RAISE NOTICE 'Ahora puedes ir a /onboarding para empezar de nuevo';
  RAISE NOTICE '===================================';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '⚠️ Error: %', SQLERRM;
    RAISE NOTICE 'Algunas tablas pueden no existir todavía. Ejecuta CREATE_ONBOARDING_PROFILE_TABLES.sql primero.';
END $$;

-- PASO 3: Verifica que todo se eliminó correctamente
SELECT 
  'onboarding_responses' as tabla,
  COUNT(*) as registros
FROM onboarding_responses 
WHERE user_id = 'PEGA_TU_USER_ID_AQUI'
UNION ALL
SELECT 'user_skills', COUNT(*) FROM user_skills WHERE user_id = 'PEGA_TU_USER_ID_AQUI'
UNION ALL
SELECT 'user_interests', COUNT(*) FROM user_interests WHERE user_id = 'PEGA_TU_USER_ID_AQUI'
UNION ALL
SELECT 'user_values', COUNT(*) FROM user_values WHERE user_id = 'PEGA_TU_USER_ID_AQUI';

-- Todos deberían mostrar 0 registros
