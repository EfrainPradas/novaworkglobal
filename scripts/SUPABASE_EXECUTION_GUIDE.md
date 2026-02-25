# 🚀 Guía Paso a Paso: Ejecutar Fast-Track System en Supabase

**Fecha:** November 22, 2025
**Status:** Listo para ejecutar

---

## 📋 ARCHIVOS NECESARIOS

1. **`CREATE_FAST_TRACK_SYSTEM_TABLES.sql`** (745 líneas) - Schema completo
2. **`VERIFY_FAST_TRACK_TABLES.sql`** - Script de verificación

**Ubicación:** Ambos están en `C:\CarrersA\`

---

## 🎯 PASO A PASO

### **PASO 1: Abrir Supabase Dashboard**

1. Ve a: https://supabase.com/dashboard
2. Selecciona tu proyecto de CareerTipsAI
3. En el menú lateral, haz clic en **"SQL Editor"**

### **PASO 2: Ejecutar el Schema Principal**

1. En SQL Editor, haz clic en **"New Query"** (o presiona el botón `+`)
2. Abre el archivo: `C:\CarrersA\CREATE_FAST_TRACK_SYSTEM_TABLES.sql`
3. Selecciona TODO el contenido (Ctrl+A)
4. Copia (Ctrl+C)
5. Pega en el SQL Editor de Supabase (Ctrl+V)
6. Haz clic en **"Run"** (o presiona Ctrl+Enter)

**⏱️ Tiempo estimado:** 10-15 segundos

**✅ Resultado esperado:**
- Verás un mensaje de éxito
- Al final deberías ver:
  ```
  ✅ Fast-Track Job Search System™ tables created successfully!
  📊 Created 13 core tables + support functions
  🔒 RLS policies enabled on all tables
  ⚡ Auto-reminders and triggers configured
  ```

### **PASO 3: Verificar las Tablas**

**Opción A: Visual (Recomendado para primera vez)**

1. En el menú lateral, haz clic en **"Table Editor"**
2. Deberías ver 13 nuevas tablas en la lista:
   - ✅ `target_company_criteria`
   - ✅ `industry_research`
   - ✅ `company_shortlist`
   - ✅ `job_applications`
   - ✅ `resume_tailoring_checklist`
   - ✅ `recruiters`
   - ✅ `recruiter_interactions`
   - ✅ `networking_contacts`
   - ✅ `networking_interactions`
   - ✅ `networking_60day_plan`
   - ✅ `user_90_second_intro`
   - ✅ `auto_reminders`
   - ✅ `fast_track_metrics`

3. Haz clic en cualquier tabla para ver su estructura
4. Verifica que tienen las columnas correctas

**Opción B: Con Script de Verificación**

1. En SQL Editor, crea **"New Query"**
2. Abre: `C:\CarrersA\VERIFY_FAST_TRACK_TABLES.sql`
3. Copia y pega todo el contenido
4. Haz clic en **"Run"**

**✅ Resultado esperado:**
```
========================================
FAST-TRACK SYSTEM VERIFICATION RESULTS
========================================

Tables Created: 13 / 13 ✅
Helper Functions: 5 / 5 ✅
RLS Enabled: 13 / 13 ✅

🎉 SUCCESS! Fast-Track System is fully installed!

📋 NEXT STEPS:
1. Initialize your 60-day plan
2. Verify plan created
3. Start building the frontend!
========================================
```

### **PASO 4: Inicializar tu Plan de 60 Días** (Opcional pero recomendado)

Esto crea automáticamente las 8 semanas de goals del workbook en tu cuenta.

1. En SQL Editor, crea **"New Query"**
2. Escribe:
   ```sql
   SELECT initialize_60day_networking_plan(auth.uid());
   ```
3. Haz clic en **"Run"**

**✅ Resultado esperado:**
- Success message

4. **Verificar que se creó:**
   ```sql
   SELECT * FROM networking_60day_plan WHERE user_id = auth.uid() ORDER BY week_number;
   ```

**✅ Resultado esperado:**
- 8 filas con las metas de cada semana:
  - Week 1: "Identify 20 contacts, reach out to 5"
  - Week 2: "Schedule 2 meetings, draft 90-sec intro"
  - Week 3: "Follow up with 5 contacts"
  - ... (hasta Week 8)

---

## 🔍 VERIFICACIÓN DETALLADA

### **Check 1: Contar Tablas**

```sql
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%company%'
   OR table_name LIKE '%job_%'
   OR table_name LIKE '%recruiter%'
   OR table_name LIKE '%networking%'
   OR table_name LIKE '%auto_%'
   OR table_name LIKE '%fast_track%';
```

**Resultado esperado:** >= 13

### **Check 2: Ver Estructura de una Tabla**

```sql
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'job_applications'
ORDER BY ordinal_position;
```

**Busca columnas clave:**
- `referral_requested` (boolean)
- `referral_contact_name` (text)
- `auto_follow_up_date` (date)

### **Check 3: Verificar RLS Activo**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'job_applications';
```

**Resultado esperado:**
- `rowsecurity` = `true`

### **Check 4: Ver Triggers**

```sql
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'job_applications';
```

**Resultado esperado:**
- `job_application_auto_follow_up` trigger
- `update_job_applications_updated_at` trigger

---

## 🐛 TROUBLESHOOTING

### **Error: "relation already exists"**

**Causa:** Las tablas ya fueron creadas antes.

**Solución:**
```sql
-- Opción 1: Drop todas las tablas (CUIDADO: Borra datos)
DROP TABLE IF EXISTS target_company_criteria CASCADE;
DROP TABLE IF EXISTS industry_research CASCADE;
-- ... (repite para todas las 13 tablas)

-- Opción 2: Usar CREATE TABLE IF NOT EXISTS (ya está en el script)
-- El script ya incluye IF NOT EXISTS, así que esto no debería pasar
```

### **Error: "function already exists"**

**Causa:** Las funciones ya fueron creadas.

**Solución:**
```sql
-- Drop y recrea
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_job_application_follow_up() CASCADE;
DROP FUNCTION IF EXISTS create_recruiter_reconnect_reminder() CASCADE;
DROP FUNCTION IF EXISTS calculate_fast_track_score(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS initialize_60day_networking_plan(UUID) CASCADE;

-- Luego vuelve a ejecutar CREATE_FAST_TRACK_SYSTEM_TABLES.sql
```

### **Error: "permission denied"**

**Causa:** No tienes permisos de admin en Supabase.

**Solución:**
- Verifica que estás logueado con la cuenta correcta
- Ve a Settings → API para confirmar que tienes el service_role key

### **No veo las tablas en Table Editor**

**Solución:**
1. Refresca la página (F5)
2. Verifica que estás en el schema "public"
3. Corre este query:
   ```sql
   SELECT schemaname, tablename
   FROM pg_tables
   WHERE tablename LIKE '%company%'
      OR tablename LIKE '%job_%'
      OR tablename LIKE '%recruiter%'
      OR tablename LIKE '%networking%';
   ```

---

## ✅ CHECKLIST DE ÉXITO

Marca cada uno después de verificar:

- [ ] SQL ejecutado sin errores
- [ ] 13 tablas visibles en Table Editor
- [ ] RLS habilitado en todas las tablas (verificado con script)
- [ ] 5 helper functions creadas (verificado con script)
- [ ] Triggers creados (verificado con script)
- [ ] 60-day plan inicializado (8 weeks)
- [ ] Ningún error en la consola de Supabase

---

## 📊 DATOS DE PRUEBA (Opcional)

Si quieres probar el sistema con datos de ejemplo:

### **1. Crear un Target Company Criteria**

```sql
INSERT INTO target_company_criteria (
    user_id,
    industry,
    role_function,
    geography,
    company_size,
    salary_range,
    notes
) VALUES (
    auth.uid(),
    'Technology',
    'Product Manager',
    'San Francisco Bay Area',
    'Series B-C Startup (100-500 employees)',
    '$140K-$180K',
    'Looking for growth-stage startups with strong product culture'
);
```

### **2. Crear una Company en el Shortlist**

```sql
INSERT INTO company_shortlist (
    user_id,
    company_name,
    industry,
    why_fits_criteria,
    recent_news,
    priority_score,
    criteria_match_count
) VALUES (
    auth.uid(),
    'Stripe',
    'Fintech',
    'Matches 5 of my 6 criteria: Tech, PM role, SF, Series B+, great culture, salary range',
    'Recently announced expansion into embedded finance. Growing PM team by 30%.',
    9,
    5
);
```

### **3. Crear un Recruiter**

```sql
INSERT INTO recruiters (
    user_id,
    recruiter_name,
    firm_name,
    recruiter_type,
    specialty,
    geography,
    is_top_25_percent,
    relationship_strength
) VALUES (
    auth.uid(),
    'Sarah Chen',
    'Korn Ferry',
    'Retained',
    'Product Management',
    'San Francisco Bay Area',
    true,
    'cold'
);
```

### **4. Ver tus datos**

```sql
-- Ver tu company criteria
SELECT * FROM target_company_criteria WHERE user_id = auth.uid();

-- Ver tu company shortlist
SELECT * FROM company_shortlist WHERE user_id = auth.uid() ORDER BY priority_score DESC;

-- Ver tus recruiters
SELECT * FROM recruiters WHERE user_id = auth.uid();

-- Ver tu 60-day plan
SELECT week_number, goals, completed FROM networking_60day_plan WHERE user_id = auth.uid() ORDER BY week_number;
```

---

## 🎯 SIGUIENTE PASO

Una vez que todo esté verificado, dime:

**"Todo funcionó correctamente! ✅"**

Y procederé a crear:

**Opción C: Fast-Track Dashboard (Overview)**
- Vista general del sistema
- Fast-Track Score (0-100)
- Progress de los 4 Steps
- Upcoming reminders
- Quick stats

Este será el "home" del nuevo módulo Fast-Track Job Search System.

---

## 📞 SOPORTE

Si algo no funciona:
1. Copia el mensaje de error completo
2. Toma screenshot si es necesario
3. Dime en qué paso te quedaste

¡Vamos a hacerlo funcionar! 💪

---

**Prepared by:** Claude Code
**Date:** November 22, 2025
**Status:** ✅ READY TO EXECUTE
