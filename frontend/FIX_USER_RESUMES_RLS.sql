-- ============================================
-- FIX USER_RESUMES RLS POLICIES
-- El problema: El SELECT no encuentra resumes existentes
-- ============================================

-- 1. Verificar que RLS está habilitado
ALTER TABLE user_resumes ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON user_resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON user_resumes;

-- 3. Crear políticas corregidas
-- SELECT: Permitir ver resumes propios
CREATE POLICY "Users can view own resumes"
  ON user_resumes
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Permitir crear resumes propios
CREATE POLICY "Users can insert own resumes"
  ON user_resumes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Permitir actualizar resumes propios
CREATE POLICY "Users can update own resumes"
  ON user_resumes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Permitir eliminar resumes propios
CREATE POLICY "Users can delete own resumes"
  ON user_resumes
  FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Verificar políticas creadas
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_resumes';

-- 5. Contar resumes por usuario (para debugging)
SELECT
  user_id,
  COUNT(*) as resume_count,
  array_agg(id) as resume_ids
FROM user_resumes
GROUP BY user_id;

-- 6. Eliminar resumes duplicados (CUIDADO: esto elimina todos menos el primero)
-- Descomenta si quieres ejecutar esto:
/*
DELETE FROM user_resumes
WHERE id NOT IN (
  SELECT MIN(id)
  FROM user_resumes
  GROUP BY user_id, is_master
);
*/

SELECT '✅ RLS policies fixed!' as status;
