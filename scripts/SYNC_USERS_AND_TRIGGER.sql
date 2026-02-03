-- ============================================================================
-- SCRIPT DE SINCRONIZACIÓN DE USUARIOS (AUTH -> PUBLIC)
-- ============================================================================
-- Este script soluciona el problema de la tabla 'users' vacía.
-- 1. Crea un Trigger para que cada usuario nuevo se copie automáticamente.
-- 2. Copia todos los usuarios EXISTENTES de auth.users a public.users.

-- 1. Crear función para manejar nuevos usuarios (Actualizado a BASIC)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.created_at,
    'basic' -- Default ahora es BASIC
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar errores si ya existe
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear el Trigger (si no existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. IMPORTANTE: Sincronizar usuarios ya existentes
-- Esto llenará tu tabla 'users' con los datos reales de tu cuenta actual
INSERT INTO public.users (id, email, full_name, created_at, subscription_tier)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'full_name', 
    created_at,
    'basic' -- Nivel por defecto ahora es BASIC
FROM auth.users
ON CONFLICT (id) DO UPDATE
SET subscription_tier = COALESCE(public.users.subscription_tier, 'basic'); -- Si ya existe, asegúrate de que tenga tier

-- Verificación final
SELECT count(*) as total_usuarios FROM public.users;
