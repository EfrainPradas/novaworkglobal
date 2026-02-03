-- ELIMINAR USUARIO COMPLETAMENTE
-- Este script elimina todos los datos del usuario de todas las tablas

-- PASO 1: Obtén tu user_id
SELECT id as user_id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- PASO 2: Reemplaza 'PEGA_TU_USER_ID_AQUI' con tu user_id y ejecuta:

-- Eliminar el usuario de auth.users (esto eliminará en cascada todo lo demás por las foreign keys)
DELETE FROM auth.users 
WHERE id = 'PEGA_TU_USER_ID_AQUI';

-- ✅ Listo! El usuario y todos sus datos relacionados han sido eliminados.
-- Ahora puedes crear un nuevo usuario desde /signup
