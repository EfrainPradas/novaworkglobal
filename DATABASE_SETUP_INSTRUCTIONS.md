# Instrucciones para Configurar las Tablas de Base de Datos

## Paso 1: Crear las Tablas en Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard/project/fytyfeapxgswxkecneom
2. Haz clic en **SQL Editor** en el menú lateral
3. Copia y pega el contenido completo del archivo `CREATE_ONBOARDING_PROFILE_TABLES.sql`
4. Haz clic en **Run** para ejecutar el script
5. Deberías ver un mensaje de éxito confirmando que las tablas se crearon

## Paso 2: Verificar las Tablas Creadas

Las siguientes tablas deberían existir ahora:

### 1. `user_skills`
- **Propósito**: Almacena las habilidades (skills) del usuario
- **Columnas**:
  - `id`: UUID (primary key)
  - `user_id`: UUID (referencia a auth.users)
  - `skill_name`: TEXT (nombre de la habilidad)
  - `source`: TEXT ('onboarding', 'resume', 'manual')
  - `created_at`, `updated_at`: TIMESTAMPTZ

### 2. `user_interests`
- **Propósito**: Almacena los intereses del usuario
- **Columnas**:
  - `id`: UUID (primary key)
  - `user_id`: UUID (referencia a auth.users)
  - `interest_name`: TEXT (nombre del interés)
  - `source`: TEXT
  - `created_at`, `updated_at`: TIMESTAMPTZ

### 3. `user_values`
- **Propósito**: Almacena los valores core del usuario
- **Columnas**:
  - `id`: UUID (primary key)
  - `user_id`: UUID (referencia a auth.users)
  - `value_id`: TEXT ('autonomy', 'growth', etc.)
  - `value_label`: TEXT (etiqueta legible)
  - `reasoning`: TEXT (por qué este valor es importante)
  - `created_at`, `updated_at`: TIMESTAMPTZ

### 4. `onboarding_responses` (ACTUALIZADA)
Se agregaron las siguientes columnas:
- `skills`: JSONB (array de skills)
- `interests`: JSONB (array de interests)
- `values`: JSONB (array de value IDs)
- `values_reasoning`: TEXT

## Paso 3: Probar el Flujo Completo

1. **Reinicia el servidor de desarrollo**:
   ```bash
   # En tu terminal WSL
   cd ~/carreerstips/frontend
   # Ctrl+C para detener si está corriendo
   npm run dev
   ```

2. **Resetea tu onboarding** (elige una opción):
   
   **Opción A: SQL en Supabase**
   ```sql
   -- Encuentra tu user_id
   SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
   
   -- Reemplaza 'TU_USER_ID' con tu ID real
   UPDATE user_profiles 
   SET onboarding_completed = false 
   WHERE user_id = 'TU_USER_ID';
   
   DELETE FROM onboarding_responses WHERE user_id = 'TU_USER_ID';
   DELETE FROM user_skills WHERE user_id = 'TU_USER_ID';
   DELETE FROM user_interests WHERE user_id = 'TU_USER_ID';
   DELETE FROM user_values WHERE user_id = 'TU_USER_ID';
   ```
   
   **Opción B: Crear un nuevo usuario**
   - Ve a `/signup` con un email diferente

3. **Completa el onboarding paso a paso**:
   - ✅ Step 1: Welcome Screen
   - ✅ Step 2: Orientation Videos (3 videos)
   - ✅ Step 3: Career Orientation
   - ✅ **Step 4 (NUEVO)**: Skills & Interests
     - Agrega al menos 3 skills
     - Agrega al menos 3 interests
     - Observa el "Sweet Spot" si hay intersección
   - ✅ **Step 5 (NUEVO)**: Core Values
     - Selecciona 3-5 valores
     - Opcionalmente agrega tu razonamiento
   - ✅ Step 6: Career Questions (job title, location)
   - ✅ Step 7: Snapshot

4. **Verifica los datos en Supabase**:
   ```sql
   -- Verifica tus skills
   SELECT * FROM user_skills WHERE user_id = 'TU_USER_ID';
   
   -- Verifica tus interests
   SELECT * FROM user_interests WHERE user_id = 'TU_USER_ID';
   
   -- Verifica tus values
   SELECT * FROM user_values WHERE user_id = 'TU_USER_ID';
   
   -- Verifica el registro completo de onboarding
   SELECT * FROM onboarding_responses WHERE user_id = 'TU_USER_ID';
   ```

## Resumen de Cambios en el Código

### Frontend (`Onboarding.tsx`)
- **Líneas 130-196**: Nueva lógica para guardar skills, interests y values en tablas separadas
- **Líneas 204-210**: Se agregan los campos nuevos a `onboarding_responses`
- Los datos se guardan en 4 lugares:
  1. `user_skills` table (normalizado)
  2. `user_interests` table (normalizado)
  3. `user_values` table (normalizado)
  4. `onboarding_responses` table (JSONB para referencia rápida)

### Base de Datos
- **3 nuevas tablas** con Row Level Security (RLS) habilitado
- **Políticas RLS** configuradas para que cada usuario solo vea sus propios datos
- **Triggers** para actualizar automáticamente `updated_at`
- **Índices** para mejorar rendimiento de consultas

## Próximos Pasos

✅ **Fase 1 Completa**: Onboarding + Videos + Context  
✅ **Fase 2 Completa**: Skills / Interests / Values + Database Storage  
⏳ **Fase 3 Pendiente**: Resume Module  
⏳ **Fase 4 Pendiente**: Salarios Dinámicos  

---

**Fecha**: 2026-01-17  
**Versión**: Phase 2 + Database Integration Complete
