-- ============================================
-- FIX: Verificar y recrear tablas de Onboarding
-- ============================================

-- Primero, eliminar las tablas si existen (para empezar de cero)
DROP TABLE IF EXISTS onboarding_responses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Recrear user_profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  target_job_title TEXT,
  current_location TEXT,
  preferred_language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recrear onboarding_responses
CREATE TABLE onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_situation TEXT,
  top_priority TEXT,
  target_job_title TEXT,
  current_location TEXT,
  preferred_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_onboarding_responses_user_id ON onboarding_responses(user_id);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para onboarding_responses
CREATE POLICY "Users can view their own responses"
  ON onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own responses"
  ON onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verificación
SELECT 'user_profiles' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'user_profiles' AND table_schema = 'public'
UNION ALL
SELECT 'onboarding_responses' as table_name, COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'onboarding_responses' AND table_schema = 'public';

-- Listar columnas de onboarding_responses para verificar
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'onboarding_responses'
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT '✅ Tablas recreadas correctamente!' as status;
