# 🔧 Solución Rápida - Error 401 Supabase

**Problema:** Error "column 'full_name' does not exist"
**Causa:** Las tablas aún no han sido creadas en la base de datos
**Solución:** Ejecutar el script de solución rápida

---

## ✅ Solución en 2 Pasos

### Paso 1: Ejecutar Script de Solución Rápida

1. **Abrir Supabase SQL Editor:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co
   ```
   - Click en "SQL Editor" en el menú lateral
   - Click en "New query"

2. **Copiar y ejecutar el script:**
   - Archivo: `C:\CarrersA\supabase-quick-fix.sql`
   - Abrir el archivo en un editor de texto
   - Copiar TODO el contenido
   - Pegar en SQL Editor
   - Click "Run" o presionar Ctrl+Enter

3. **Verificar éxito:**
   - Deberías ver: "✅ Quick fix applied successfully!"
   - Deberías ver: "✅ Minimal tables created: users, user_profiles"

### Paso 2: Refrescar el Frontend

1. Ir a: http://localhost:5173
2. Presionar F5 para refrescar
3. El error 401 debería estar resuelto ✅

---

## 🎯 ¿Qué Hace Este Script?

**Crea tablas mínimas para testing:**
- ✅ Tabla `users` (versión básica)
- ✅ Tabla `user_profiles` (versión básica)
- ✅ Habilita RLS (Row Level Security)
- ✅ Crea políticas temporales para testing
- ✅ Crea triggers para auto-actualización

**Permite que el frontend se conecte sin errores 401**

---

## ⚠️ IMPORTANTE

Este es un **fix rápido solo para testing**. Crea las tablas mínimas necesarias.

**Después de probar que funciona**, debes ejecutar el schema completo:

### Paso 3: Ejecutar Schema Completo (Después)

1. **Mismo SQL Editor en Supabase**
2. **Nueva query**
3. **Copiar contenido de:** `C:\CarrersA\schema.sql` (archivo de 29KB)
4. **Ejecutar**

Esto creará las 25+ tablas completas con todas las columnas y relaciones.

---

## 🔍 Verificación

Después de ejecutar el quick-fix, verifica:

```sql
-- En SQL Editor, ejecuta esto para verificar:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Deberías ver al menos:
- ✅ users
- ✅ user_profiles

---

## 🐛 Troubleshooting

### Si el script falla:

**Error: "permission denied"**
- Asegúrate de estar logueado en Supabase
- Verifica que estás en el proyecto correcto

**Error: "already exists"**
- Algunas tablas ya existen, esto es normal
- El script usa `CREATE TABLE IF NOT EXISTS`

**Error: "syntax error"**
- Asegúrate de copiar TODO el contenido del archivo
- No debe faltar ninguna línea

### Si persiste el 401:

1. **Verifica la anon key en .env.local:**
   ```bash
   cat /home/efraiprada/carreerstips/frontend/.env.local
   ```
   Debe ser: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzI3NTMsImV4cCI6MjA3ODY0ODc1M30.95IwWjhLEPkvaeHw5Izr3lD2TpbEO8fzGS_V2d2CpIY`

2. **Reiniciar dev server:**
   ```bash
   # En la terminal donde corre el servidor, presiona Ctrl+C
   # Luego:
   npm run dev
   ```

3. **Limpiar caché del navegador:**
   - Presiona Ctrl+Shift+R (recarga forzada)
   - O abre DevTools (F12) y click derecho en el botón de recarga → "Empty Cache and Hard Reload"

---

## 📊 Resultado Esperado

Después de ejecutar el quick-fix y refrescar, en http://localhost:5173 deberías ver:

```
✅ Supabase Client: Initialized
✅ Database Connection: Connected
⚠️ Authentication Session: No active session (expected)
⚠️ User Authentication: No user (expected)
```

Las advertencias de "No active session" son **normales** - significa que no hay usuario logueado todavía.

---

## 🚀 Próximos Pasos

Una vez que el frontend se conecte exitosamente:

1. **✅ AHORA: Ejecutar `supabase-quick-fix.sql`** ← Estás aquí
2. **🔜 DESPUÉS: Ejecutar `schema.sql` completo** (25+ tablas)
3. **🔜 LUEGO: Configurar OAuth providers** (Google, LinkedIn)
4. **🔜 FINALMENTE: Crear productos en Stripe**

---

## 📁 Archivos Disponibles

Todos estos archivos están en `C:\CarrersA\`:

- ✅ `supabase-quick-fix.sql` (este script - solución rápida)
- ✅ `schema.sql` (schema completo - ejecutar después)
- ✅ `supabase-initial-setup.sql` (setup de RLS - ya no es necesario)
- ✅ `SUPABASE_CONNECTION_TROUBLESHOOTING.md` (guía completa)

---

## 💡 Resumen

**Problema:** Error 401 "Invalid API key"
**Causa Real:** Tablas no existen en la base de datos
**Solución:** Ejecutar `supabase-quick-fix.sql` en SQL Editor

**Después del fix:**
1. ✅ Tablas mínimas creadas
2. ✅ RLS configurado
3. ✅ Frontend puede conectarse
4. ✅ Sin errores 401

---

**¡Ejecuta el script y refresca el navegador! El error debería estar resuelto en 2 minutos.**

---

**Preparado por:** Claude Code
**Fecha:** 18 de Noviembre, 2025
**Estado:** ✅ Script listo para ejecutar
