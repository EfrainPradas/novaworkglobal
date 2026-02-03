-- ============================================================================
-- SCRIPT DE MIGRACIÓN: FREE -> BASIC
-- ============================================================================
-- Este script actualiza tu base de datos para eliminar el concepto de "free" 
-- y estandarizar todo a "basic".

-- 1. Actualizar el valor por defecto de la columna en la tabla `users`
ALTER TABLE public.users 
ALTER COLUMN subscription_tier SET DEFAULT 'basic';

-- 2. Migrar usuarios existentes de 'free' a 'basic'
UPDATE public.users 
SET subscription_tier = 'basic' 
WHERE subscription_tier = 'free';

-- 3. Actualizar la función del Trigger para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, created_at, subscription_tier)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.created_at,
    'basic'  -- <--- CAMBIO AQUÍ: Antes era 'free' (o implícito)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verificación
SELECT subscription_tier, count(*) as total 
FROM public.users 
GROUP BY subscription_tier;
