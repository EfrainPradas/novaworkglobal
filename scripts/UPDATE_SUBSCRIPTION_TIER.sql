-- ============================================================================
-- SCRIPT PARA CAMBIAR MANUALMENTE EL NIVEL DE SUSCRIPCIÓN
-- ============================================================================
-- Instrucciones:
-- 1. Reemplaza 'tu_email_aqui@ejemplo.com' con el email de tu usuario real.
-- 2. Ejecuta SOLO UNO de los siguientes comandos según el nivel que quieras probar.

-- OPCIÓN A: Convertir a EXECUTIVE (Acceso total a todo)
-- UPDATE users 
-- SET subscription_tier = 'executive' 
-- WHERE email = 'tu_email_aqui@ejemplo.com';

-- OPCIÓN B: Convertir a PRO (Acceso medio)
-- UPDATE users 
-- SET subscription_tier = 'pro' 
-- WHERE email = 'tu_email_aqui@ejemplo.com';

-- OPCIÓN C: Convertir a BASIC (Nivel de entrada)
UPDATE users 
SET subscription_tier = 'basic' 
WHERE email = 'tu_email_aqui@ejemplo.com';

-- Verificar el cambio
SELECT id, email, subscription_tier FROM users WHERE email = 'tu_email_aqui@ejemplo.com';
