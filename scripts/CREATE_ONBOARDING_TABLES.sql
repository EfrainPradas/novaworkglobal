-- ============================================
-- Tablas para Onboarding - CareerTipsAI
-- ============================================

-- 1. Tabla user_profiles (si no existe)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  target_job_title TEXT,
  current_location TEXT,
  preferred_language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla onboarding_responses
CREATE TABLE IF NOT EXISTS onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  current_situation TEXT,
  top_priority TEXT,
  target_job_title TEXT,
  current_location TEXT,
  preferred_language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_responses_user_id ON onboarding_responses(user_id);

-- 4. RLS (Row Level Security) - Usuarios solo pueden ver sus propios datos
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas para onboarding_responses
DROP POLICY IF EXISTS "Users can view their own responses" ON onboarding_responses;
CREATE POLICY "Users can view their own responses"
  ON onboarding_responses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own responses" ON onboarding_responses;
CREATE POLICY "Users can insert their own responses"
  ON onboarding_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Trigger para actualizar updated_at en user_profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Función para crear user_profile automáticamente cuando se crea un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'locale', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear user_profile automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- Verificación
-- ============================================

-- Verificar que las tablas se crearon correctamente
SELECT
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('user_profiles', 'onboarding_responses');

-- Verificar políticas RLS
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('user_profiles', 'onboarding_responses');

SELECT '✅ Tablas de Onboarding creadas exitosamente!' as status;
