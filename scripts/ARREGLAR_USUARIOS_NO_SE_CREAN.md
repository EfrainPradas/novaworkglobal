# 🔧 Arreglar: Usuarios no se crean en la tabla `users`

**Fecha:** 20 de Noviembre, 2025
**Problema:** Usuarios se registran pero no aparecen en la tabla `public.users`
**Causa:** Falta trigger para copiar de `auth.users` a `public.users`

---

## 🔍 Diagnóstico del Problema

### ¿Qué está pasando?

Cuando un usuario se registra con email/password o con OAuth (Google, LinkedIn), Supabase Auth **SÍ está creando el usuario**, pero solo en la tabla interna `auth.users`.

**Tu aplicación tiene DOS tablas de usuarios:**

1. **`auth.users`** (Tabla interna de Supabase Auth)
   - Maneja autenticación
   - Almacena passwords (encriptados)
   - Gestiona sesiones y tokens
   - ✅ Los usuarios SÍ se están creando aquí

2. **`public.users`** (Tu tabla de aplicación)
   - Almacena datos de perfil
   - Subscription tier, idioma, onboarding, etc.
   - Referenciada por otras tablas (user_profiles, resumes, etc.)
   - ❌ Los usuarios NO se están creando aquí

### ¿Por qué pasa esto?

Supabase Auth **NO** crea automáticamente registros en `public.users`. Necesitas crear un **Database Trigger** que copie automáticamente el usuario cuando se registra.

---

## 🛠️ Solución: Crear Database Trigger

### Paso 1: Acceder a Supabase SQL Editor

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión
3. Selecciona tu proyecto **CareerTipsAI**
4. En el menú lateral, click en **SQL Editor** (icono de código)

### Paso 2: Ejecutar el SQL del Trigger

1. Click en **"New query"** o **"+"**
2. Copia y pega el contenido del archivo: `supabase_trigger_create_user.sql`
3. Click en **"Run"** o presiona `Ctrl+Enter`

El SQL completo está en: `/home/efraiprada/carreerstips/supabase_trigger_create_user.sql`

### Paso 3: Verificar que el Trigger se Creó

Ejecuta esta query en el SQL Editor:

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Resultado esperado:**
```
trigger_name          | on_auth_user_created
event_manipulation    | INSERT
event_object_table    | users
action_statement      | EXECUTE FUNCTION public.handle_new_user()
```

Si ves esto, el trigger está instalado correctamente ✅

---

## 🧪 Probar el Trigger

### Opción A: Registrar un nuevo usuario

1. Ve a: http://localhost:5174/signup
2. Registra un nuevo usuario con email/password:
   - Email: `test@example.com`
   - Password: `Test1234!`
3. Espera el mensaje de éxito
4. Ve a Supabase Dashboard → SQL Editor
5. Ejecuta:
   ```sql
   SELECT id, email, full_name, onboarding_completed
   FROM public.users
   ORDER BY created_at DESC
   LIMIT 1;
   ```

**Resultado esperado:**
```
id       | <UUID>
email    | test@example.com
full_name| test
onboarding_completed | false
```

### Opción B: Registrar con Google OAuth

1. Configura las Redirect URLs en Supabase (ver `ARREGLAR_GOOGLE_OAUTH_SUPABASE.md`)
2. Ve a: http://localhost:5174/signup
3. Click en "Continue with Google"
4. Completa el OAuth flow
5. Verifica en Supabase:
   ```sql
   SELECT id, email, full_name
   FROM public.users
   WHERE email = 'efrain.pradas@gmail.com';
   ```

**Resultado esperado:**
```
id       | <UUID>
email    | efrain.pradas@gmail.com
full_name| Efrain Prada (o lo que tengas en Google)
```

---

## 🔍 Cómo Funciona el Trigger

### Flujo del Trigger:

```
Usuario se registra (email/password o OAuth)
             ↓
Supabase Auth crea registro en auth.users
             ↓
TRIGGER: on_auth_user_created se dispara
             ↓
FUNCIÓN: handle_new_user() se ejecuta
             ↓
Extrae datos del nuevo usuario:
  - id (UUID de auth.users)
  - email
  - full_name (de OAuth metadata o email)
             ↓
INSERT en public.users con esos datos
             ↓
Usuario ahora existe en ambas tablas ✅
```

### ¿Qué datos copia el trigger?

| Campo | De dónde viene | Ejemplo |
|-------|----------------|---------|
| `id` | `auth.users.id` | `550e8400-e29b-41d4-a716-446655440000` |
| `email` | `auth.users.email` | `efrain.pradas@gmail.com` |
| `full_name` | OAuth metadata o email prefix | `Efrain Prada` o `efrain.pradas` |
| `password_hash` | NULL (manejado por Supabase) | NULL |
| `preferred_language` | Default: 'en' | `en` |
| `subscription_tier` | Default: 'free' | `free` |
| `onboarding_completed` | Default: FALSE | `false` |

### Extracción de `full_name`:

El trigger es inteligente para extraer el nombre:

1. **Google OAuth:** Usa `raw_user_meta_data->>'name'`
2. **LinkedIn OAuth:** Combina `first_name` + `last_name`
3. **Email/Password:** Usa parte antes del `@`
   - Ejemplo: `test@example.com` → `test`

---

## 🐛 Troubleshooting

### Problema: El trigger no se ejecuta

**Síntoma:** Usuario aparece en `auth.users` pero NO en `public.users`

**Posibles causas:**

1. **Trigger no se creó correctamente**
   - Verifica con la query de verificación (Paso 3)
   - Si no aparece, vuelve a ejecutar el SQL

2. **Conflicto con id existente**
   - El trigger usa `ON CONFLICT (id) DO NOTHING`
   - Si el UUID ya existe, no hace nada
   - Solución: Elimina el usuario duplicado manualmente

3. **Permisos insuficientes**
   - El trigger usa `SECURITY DEFINER`
   - Debe tener permisos para insertar en `public.users`

**Verificar trigger:**
```sql
-- Ver si el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Ver la función del trigger
\df public.handle_new_user
```

### Problema: Error "duplicate key value violates unique constraint"

**Causa:** Ya existe un usuario con ese `id` o `email`

**Solución:**
```sql
-- Ver usuarios duplicados
SELECT id, email FROM public.users WHERE email = 'test@example.com';
SELECT id, email FROM auth.users WHERE email = 'test@example.com';

-- Eliminar del que NO debería estar
DELETE FROM public.users WHERE email = 'test@example.com';
-- O
DELETE FROM auth.users WHERE email = 'test@example.com';
```

### Problema: `full_name` es NULL o raro

**Causa:** OAuth provider no envía el campo esperado

**Solución temporal:**
```sql
-- Actualizar manualmente
UPDATE public.users
SET full_name = 'Nombre Correcto'
WHERE email = 'tu@email.com';
```

**Solución permanente:**
Edita la función `handle_new_user()` para extraer de otro campo.

---

## 📊 Verificar Todo Está Correcto

### 1. Ver usuarios en ambas tablas:

```sql
-- Ver auth.users
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as google_name,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- Ver public.users
SELECT
  id,
  email,
  full_name,
  subscription_tier,
  onboarding_completed,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;
```

### 2. Verificar que los IDs coinciden:

```sql
-- Ver usuarios que están en auth.users pero NO en public.users
SELECT
  a.id,
  a.email,
  a.created_at
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;
```

**Resultado esperado:** Sin resultados (todos los usuarios de auth están en public)

### 3. Ver metadata de OAuth:

```sql
SELECT
  email,
  raw_user_meta_data
FROM auth.users
WHERE email = 'efrain.pradas@gmail.com';
```

Esto te muestra qué datos envía Google/LinkedIn.

---

## 🔄 Migrar Usuarios Existentes

Si ya tienes usuarios en `auth.users` que NO están en `public.users`, puedes migrarlos manualmente:

```sql
-- Insertar todos los usuarios de auth.users que faltan en public.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  password_hash,
  preferred_language,
  subscription_tier,
  onboarding_completed,
  created_at,
  updated_at
)
SELECT
  a.id,
  a.email,
  COALESCE(
    a.raw_user_meta_data->>'full_name',
    a.raw_user_meta_data->>'name',
    CONCAT(a.raw_user_meta_data->>'first_name', ' ', a.raw_user_meta_data->>'last_name'),
    SPLIT_PART(a.email, '@', 1)
  ) as full_name,
  NULL as password_hash,
  'en' as preferred_language,
  'free' as subscription_tier,
  FALSE as onboarding_completed,
  a.created_at,
  NOW() as updated_at
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;
```

**⚠️ CUIDADO:** Ejecuta esto solo UNA VEZ. Verifica primero cuántos usuarios faltan:

```sql
SELECT COUNT(*)
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL;
```

---

## ✅ Checklist de Verificación

- [ ] Ejecuté el SQL del trigger en Supabase SQL Editor
- [ ] Verifiqué que el trigger existe (query de verificación)
- [ ] Registré un usuario de prueba con email/password
- [ ] Verifiqué que el usuario aparece en `public.users`
- [ ] Probé con Google OAuth (opcional si ya configuraste)
- [ ] Verifiqué que el `full_name` se extrae correctamente
- [ ] Migré usuarios existentes si había alguno en `auth.users`
- [ ] Confirmé que todos los usuarios nuevos se crean automáticamente

---

## 🎯 Resultado Esperado

Después de aplicar el trigger:

1. ✅ Usuario se registra con email/password
2. ✅ Usuario aparece en `auth.users` (Supabase Auth)
3. ✅ **TRIGGER automáticamente crea registro en `public.users`**
4. ✅ Usuario puede completar onboarding
5. ✅ Todas las tablas relacionadas (user_profiles, resumes, etc.) funcionan

**ANTES del trigger:**
```
auth.users: ✅ Usuario existe
public.users: ❌ Usuario NO existe
```

**DESPUÉS del trigger:**
```
auth.users: ✅ Usuario existe
public.users: ✅ Usuario existe (creado automáticamente)
```

---

## 📞 Soporte Adicional

Si después de seguir estos pasos el trigger no funciona:

1. **Verifica logs de Supabase:**
   - Dashboard → Logs → Postgres Logs
   - Busca errores relacionados con el trigger

2. **Verifica que la tabla `public.users` existe:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'users';
   ```

3. **Verifica que la columna `id` en `public.users` acepta UUID:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'id';
   ```

   Debe ser: `uuid`

4. **Ejecuta el trigger manualmente para un usuario existente:**
   ```sql
   -- Forzar ejecución del trigger para un usuario específico
   SELECT public.handle_new_user()
   FROM auth.users
   WHERE email = 'test@example.com';
   ```

---

**Preparado por:** Claude Code
**Fecha:** 20 de Noviembre, 2025
**Archivo SQL:** `supabase_trigger_create_user.sql`
**Próximo paso:** Ejecutar SQL en Supabase Dashboard
