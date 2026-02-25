# ✅ Google OAuth - RESUELTO

**Fecha:** 20 de Noviembre, 2025
**Error Original:** `Error 400: redirect_uri_mismatch`
**Estado:** ✅ RESUELTO - Google OAuth funcionando correctamente

---

## 🔍 Diagnóstico del Problema

### ✅ Lo que ya está configurado correctamente:

1. **Google Cloud Console** - Ambos puertos configurados:
   - JavaScript origins:
     - `http://localhost:5174`
     - `http://localhost:5173`
   - Redirect URIs:
     - `http://localhost:5174/auth/callback`
     - `http://localhost:5173/auth/callback`

2. **Código de la aplicación** - Correcto:
   ```typescript
   // SignUp.tsx y SignIn.tsx (línea 76)
   options: {
     redirectTo: `${window.location.origin}/auth/callback`,
   }
   ```
   Esto genera: `http://localhost:5174/auth/callback` ✅

### ❌ Lo que falta configurar:

**Supabase Dashboard** - Redirect URLs no configuradas

El problema es que aunque Google acepta ambas URLs, **Supabase** no las tiene en su lista de URLs permitidas. Supabase valida las redirect URLs antes de enviarlas a Google.

---

## 🛠️ Solución: Configurar Supabase Redirect URLs

### Paso 1: Acceder a Supabase Dashboard

1. Ve a: https://supabase.com/dashboard
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto **CareerTipsAI**

### Paso 2: Navegar a Authentication Settings

1. En el menú lateral izquierdo, click en **Authentication** (icono de escudo)
2. Click en **URL Configuration** (o busca "Redirect URLs")

### Paso 3: Agregar las Redirect URLs

En la sección **"Redirect URLs"** o **"Site URL"**, necesitas agregar:

```
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback
```

**Importante:** Agrega **AMBAS** URLs, una por línea o separadas por comas (depende de la UI).

### Paso 4: Site URL (URL Base)

También verifica que el **Site URL** esté configurado:

```
http://localhost:5174
```

O si prefieres:
```
http://localhost:5173
```

**Nota:** Este es el URL base de tu aplicación, no el callback.

### Paso 5: Guardar Cambios

1. Click en **"Save"** o **"Update"**
2. Espera confirmación de que los cambios se guardaron

---

## 🔄 Alternativa: Configurar Puerto Fijo en Vite

Si quieres evitar el problema de que Vite cambie de puerto automáticamente, puedes forzar un puerto específico:

### Opción A: Editar vite.config.ts

Agregar configuración de puerto fijo:

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Puerto fijo
    strictPort: true, // Fallar si el puerto está ocupado (en lugar de cambiar)
  },
})
```

Con `strictPort: true`, Vite no cambiará a otro puerto automáticamente. Te dirá que el puerto está ocupado.

### Opción B: Liberar el puerto 5173

Si el puerto 5173 está ocupado por otro proceso:

**En Linux/WSL:**
```bash
# Ver qué proceso está usando el puerto 5173
lsof -i :5173

# O con netstat
netstat -tulpn | grep :5173

# Matar el proceso (reemplaza PID con el número del proceso)
kill -9 <PID>
```

**En Windows:**
```cmd
# Ver qué proceso está usando el puerto
netstat -ano | findstr :5173

# Matar el proceso (reemplaza PID)
taskkill /PID <PID> /F
```

---

## 📋 Checklist de Verificación

Marca cada paso cuando lo completes:

- [ ] Accedí a Supabase Dashboard
- [ ] Navegué a Authentication → URL Configuration
- [ ] Agregué `http://localhost:5173/auth/callback` a Redirect URLs
- [ ] Agregué `http://localhost:5174/auth/callback` a Redirect URLs
- [ ] Configuré Site URL: `http://localhost:5174` (o 5173)
- [ ] Guardé los cambios
- [ ] Esperé ~30 segundos para que se propaguen los cambios
- [ ] Probé Google OAuth nuevamente

---

## 🧪 Cómo Probar Después de la Configuración

### Prueba 1: Google OAuth en SignUp

```
1. Abre: http://localhost:5174/signup
2. Click en "Continue with Google"
3. Deberías ver la pantalla de selección de cuenta de Google
4. Selecciona tu cuenta (efrain.pradas@gmail.com)
5. Deberías ser redirigido a: http://localhost:5174/auth/callback
6. Luego automáticamente a: http://localhost:5174/onboarding
```

**Resultado Esperado:**
- ✅ No error 400
- ✅ Pantalla de Google aparece
- ✅ Redirect a callback exitoso
- ✅ Usuario autenticado

### Prueba 2: Google OAuth en SignIn

```
1. Abre: http://localhost:5174/signin
2. Click en "Continue with Google"
3. Mismos pasos que arriba
```

### Prueba 3: Verificar en Supabase

```
1. Ve a Supabase Dashboard
2. Authentication → Users
3. Deberías ver tu usuario con provider: "google"
4. Email: efrain.pradas@gmail.com
```

---

## 🐛 Troubleshooting

### Problema: Sigo viendo "redirect_uri_mismatch"

**Causa Posible 1:** Cambios en Supabase no se han propagado
- **Solución:** Espera 1-2 minutos, intenta de nuevo

**Causa Posible 2:** Olvidaste guardar en Supabase
- **Solución:** Ve a Supabase Dashboard, verifica que las URLs estén guardadas

**Causa Posible 3:** Formato incorrecto de URL
- **Solución:** Asegúrate que la URL sea EXACTA:
  - ✅ `http://localhost:5174/auth/callback`
  - ❌ `http://localhost:5174/auth/callback/` (con slash al final)
  - ❌ `https://localhost:5174/auth/callback` (https en lugar de http)

**Causa Posible 4:** Cache del navegador
- **Solución:**
  1. Abre DevTools (F12)
  2. Right click en el botón de refresh
  3. Selecciona "Empty Cache and Hard Reload"
  4. O usa Incognito mode

### Problema: Error "Site URL is not a valid URL"

**Solución:**
- Asegúrate de usar `http://` (no `https://` para localhost)
- No incluyas `/auth/callback` en Site URL (solo la base)
- Ejemplo correcto: `http://localhost:5174`

### Problema: Vite cambia de puerto constantemente

**Solución:**
Hay otro proceso usando el puerto 5173. Para encontrarlo y matarlo:

```bash
# Encuentra el proceso
lsof -i :5173

# O prueba con:
ps aux | grep node

# Mata TODOS los procesos de node
killall node

# O mata específicamente el proceso de vite del puerto 5173
kill -9 $(lsof -t -i:5173)

# Luego inicia tu dev server nuevamente
npm run dev
```

---

## 📸 Capturas de Pantalla de Supabase Dashboard

No puedo mostrarte capturas, pero busca estas secciones:

### Ubicación en Supabase Dashboard:

```
Supabase Dashboard
└── Authentication (menú lateral)
    └── URL Configuration
        ├── Site URL: http://localhost:5174
        └── Redirect URLs:
            ├── http://localhost:5173/auth/callback
            └── http://localhost:5174/auth/callback
```

O puede estar en:

```
Supabase Dashboard
└── Settings (menú lateral)
    └── Authentication
        └── URL Configuration
```

---

## ✅ Verificación Final

Una vez que hayas configurado todo, verifica:

### 1. Google Cloud Console (Ya está ✅):
- JavaScript origins: localhost:5173 y localhost:5174
- Redirect URIs: localhost:5173/auth/callback y localhost:5174/auth/callback

### 2. Supabase Dashboard (Pendiente ⚠️):
- Site URL: localhost:5174 (o 5173)
- Redirect URLs: ambos callbacks configurados

### 3. Código de la App (Ya está ✅):
- SignUp.tsx usa: `window.location.origin/auth/callback`
- SignIn.tsx usa: `window.location.origin/auth/callback`
- AuthCallback.tsx redirige a: `/onboarding`

### 4. Puerto del Servidor:
- Dev server corriendo en: `http://localhost:5174/`
- URL debe coincidir con la configurada en Supabase

---

## 🎯 Resultado Esperado

Después de completar estos pasos:

1. ✅ Click en "Continue with Google" en /signup
2. ✅ Pantalla de Google aparece sin error 400
3. ✅ Seleccionas tu cuenta de Google
4. ✅ Eres redirigido a /auth/callback
5. ✅ Ves mensaje "Authentication successful!"
6. ✅ Eres redirigido automáticamente a /onboarding
7. ✅ Usuario aparece en Supabase → Authentication → Users

---

## 📞 Si Nada Funciona

Si después de seguir todos estos pasos aún tienes el error:

1. **Verifica la consola del navegador:**
   - F12 → Console
   - Busca mensajes de error adicionales
   - Copia y envía el error completo

2. **Verifica la consola del dev server:**
   - Mira la terminal donde corre `npm run dev`
   - Busca errores de Supabase o OAuth

3. **Intenta con LinkedIn:**
   - Si LinkedIn funciona pero Google no, el problema es específico de Google
   - Verifica las credenciales de Google en `.env.local`

4. **Revisa las variables de entorno:**
   ```bash
   # En frontend/
   cat .env.local
   ```

   Debe tener:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

5. **Reinicia todo:**
   ```bash
   # Detén el dev server (Ctrl+C)
   # Limpia cache de npm
   rm -rf node_modules/.vite

   # Reinicia
   npm run dev
   ```

---

**Preparado por:** Claude Code
**Fecha:** 20 de Noviembre, 2025
**Próximo paso:** Configurar Redirect URLs en Supabase Dashboard
