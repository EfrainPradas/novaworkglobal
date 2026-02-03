-- ============================================================================
-- SCRIPT DE MIGRACIÓN: SOPORTE PARA PRUEBAS GRATUITAS (TRIALS)
-- ============================================================================

-- 1. Agregar columna para rastrear fin del trial
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. Actualizar la función del Trigger para manejar trials desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  is_trial BOOLEAN;
  trial_tier TEXT;
  final_tier TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  -- Extraer info de metadata
  is_trial := (NEW.raw_user_meta_data->>'is_trial')::BOOLEAN;
  trial_tier := NEW.raw_user_meta_data->>'trial_tier';
  
  -- Lógica de asignación de tier
  IF is_trial IS TRUE AND trial_tier IN ('pro', 'executive') THEN
    final_tier := trial_tier;
    trial_end := NOW() + INTERVAL '7 days';
  ELSE
    final_tier := 'basic';
    trial_end := NULL;
  END IF;

  INSERT INTO public.users (id, email, full_name, created_at, subscription_tier, trial_ends_at)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.created_at,
    final_tier,
    trial_end
  )
  ON CONFLICT (id) DO UPDATE SET
    subscription_tier = EXCLUDED.subscription_tier,
    trial_ends_at = EXCLUDED.trial_ends_at; -- Actualizar si ya existe (caso raro de invite)

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'trial_ends_at';
