# 🔧 Habilitar LinkedIn en Supabase - Paso a Paso

**Error Actual:** `Unsupported provider: provider is not enabled`
**Solución:** Habilitar y configurar LinkedIn en Supabase Dashboard

---

## ✅ Paso 1: Abrir Supabase Dashboard

1. **Ir a:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co
   ```

2. **Iniciar sesión** si es necesario

---

## ✅ Paso 2: Navegar a Authentication

1. En el menú lateral izquierdo, buscar **"Authentication"**
2. Click en **"Authentication"**
3. Luego click en **"Providers"** (segunda opción en el submenú)

---

## ✅ Paso 3: Buscar LinkedIn

1. En la lista de providers, **scroll hacia abajo**
2. Buscar **"LinkedIn"** (está en orden alfabético)
3. **Click en "LinkedIn"** para abrir la configuración

---

## ✅ Paso 4: Habilitar LinkedIn

En la página de configuración de LinkedIn:

### 4.1 Habilitar el Provider

1. Buscar el **toggle switch** en la parte superior
2. **Activar** el switch (debe ponerse en azul/verde): **ON** ✅

### 4.2 Configurar Credentials

**IMPORTANTE:** Supabase tiene DOS opciones para LinkedIn:
- ❌ `linkedin` (deprecated - NO usar)
- ✅ `linkedin_oidc` (OpenID Connect - usar esta)

Asegúrate de que diga **"LinkedIn (OpenID Connect)"** o verifica que el provider sea `linkedin_oidc`.

**Ingresar las credenciales:**

**Client ID:**
```
86ioz1e0hnft46
```

**Client Secret:**
```
REDACTED_SECRET
```

### 4.3 Copiar Callback URL

Supabase mostrará una **"Callback URL (for OAuth)"** algo como:
```
https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback
```

**📋 COPIAR esta URL** - la necesitarás en el siguiente paso.

### 4.4 Guardar

1. **Click en "Save"** o "Guardar" en la parte inferior
2. Esperar confirmación: "Provider updated successfully" ✅

---

## ✅ Paso 5: Configurar Redirect URI en LinkedIn

Ahora necesitas agregar la Callback URL de Supabase en LinkedIn Developer Portal:

### 5.1 Abrir LinkedIn Developer Portal

1. **Ir a:**
   ```
   https://www.linkedin.com/developers/apps
   ```

2. **Iniciar sesión** con tu cuenta de LinkedIn

### 5.2 Seleccionar Tu App

1. Buscar la app con **Client ID: 86ioz1e0hnft46**
2. **Click en la app** para abrirla

### 5.3 Configurar OAuth Settings

1. En el menú de la app, buscar **"Auth"** o **"Authentication"**
2. Click en **"Auth"**
3. Scroll hasta **"OAuth 2.0 settings"**

### 5.4 Agregar Redirect URL

1. En **"Redirect URLs"** o **"Authorized redirect URIs for your app"**
2. Click en **"+ Add redirect URL"** o botón similar
3. **Pegar la URL copiada de Supabase:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback
   ```
4. **Click "Add"** o "Agregar"
5. **Click "Update"** o "Guardar" en la parte inferior de la página

### 5.5 Verificar Scopes (Permisos)

En la misma página, verificar que tienes estos **scopes** habilitados:

- ✅ `openid` (Authentication)
- ✅ `profile` (Name, photo)
- ✅ `email` (Email address)

Si no están habilitados:
1. Buscar **"OAuth 2.0 scopes"** o similar
2. Seleccionar los scopes necesarios
3. Puede requerir **"Request access"** para algunos scopes
4. Guardar cambios

---

## ✅ Paso 6: Probar la Conexión

### 6.1 Refrescar Frontend

1. Ir a: http://localhost:5173
2. Presionar **F5** para refrescar

### 6.2 Hacer Click en el Botón

1. Click en **"Sign in with LinkedIn"**
2. **Ya NO deberías ver** el error `provider is not enabled`

### 6.3 Flujo Esperado

1. **Redirige a LinkedIn** ✅
2. **Pide autorización** (la primera vez)
3. **Redirige de vuelta** a tu app
4. **Muestra "Success!"** ✅
5. **Usuario autenticado** ✅

---

## 🔍 Verificación Rápida

### Verificar en Supabase Dashboard

1. Authentication → Providers → LinkedIn
2. Debe mostrar:
   - Status: **Enabled** ✅ (toggle en azul/verde)
   - Client ID: `86ioz1e0hnft46` ✅
   - Callback URL mostrada

### Verificar en LinkedIn Developer Portal

1. Tu app → Auth → OAuth 2.0 settings
2. Redirect URLs debe incluir:
   - `https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback` ✅

### Verificar en Frontend

1. Abrir consola del navegador (F12)
2. Click en botón LinkedIn
3. Debe mostrar:
   ```
   🔗 Initiating LinkedIn OAuth...
   ✅ Redirecting to LinkedIn...
   ```
4. **NO debe mostrar:** `❌ LinkedIn OAuth error`

---

## 🐛 Troubleshooting

### Error: "Unsupported provider: provider is not enabled"

**Causa:** LinkedIn no está habilitado en Supabase
**Solución:**
1. Verificar que el toggle está en **ON** (azul/verde)
2. Verificar que guardaste los cambios (click "Save")
3. Esperar 10-20 segundos para que se propague
4. Refrescar la página del frontend

### Error: "Invalid redirect_uri"

**Causa:** La URL en LinkedIn no coincide con Supabase
**Solución:**
1. Copiar EXACTAMENTE la Callback URL de Supabase
2. Agregar en LinkedIn sin espacios ni caracteres extra
3. Debe ser HTTPS (no HTTP)
4. No debe tener trailing slash (/)

### Error: "Invalid client credentials"

**Causa:** Client ID o Secret incorrectos
**Solución:**
1. Verificar Client ID en Supabase Dashboard
2. Re-copiar de LinkedIn Developer Portal
3. Asegurarse de no incluir espacios al inicio/final

### Error: "Access denied"

**Causa:** Falta scope o app no aprobada por LinkedIn
**Solución:**
1. Verificar scopes en LinkedIn Developer Portal
2. Para apps en desarrollo, usar cuenta personal LinkedIn
3. Para producción, solicitar app review a LinkedIn

---

## 📊 Checklist Completo

Antes de probar, verificar:

### En Supabase Dashboard:
- [ ] Authentication → Providers abierto
- [ ] LinkedIn encontrado en la lista
- [ ] Toggle switch: **ON** (azul/verde)
- [ ] Provider type: **linkedin_oidc** (OpenID Connect)
- [ ] Client ID ingresado: `86ioz1e0hnft46`
- [ ] Client Secret ingresado: `REDACTED_SECRET`
- [ ] Callback URL copiada
- [ ] Cambios guardados (click "Save")

### En LinkedIn Developer Portal:
- [ ] App abierta (Client ID: 86ioz1e0hnft46)
- [ ] Auth tab abierto
- [ ] OAuth 2.0 settings encontrado
- [ ] Redirect URL agregada: `https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback`
- [ ] Scopes habilitados: openid, profile, email
- [ ] Cambios guardados

### En Frontend:
- [ ] Página refrescada (F5)
- [ ] Botón "Sign in with LinkedIn" visible
- [ ] Consola del navegador abierta (F12)

---

## 🎯 Resultado Esperado

Después de completar todos los pasos:

**Al hacer click en "Sign in with LinkedIn":**

1. **Consola muestra:**
   ```
   🔗 Initiating LinkedIn OAuth...
   ✅ Redirecting to LinkedIn...
   ```

2. **Navegador redirige a LinkedIn:**
   - URL tipo: `https://www.linkedin.com/oauth/v2/authorization?...`
   - Muestra página de autorización de LinkedIn

3. **Aceptas permisos en LinkedIn**

4. **Redirige de vuelta:**
   - Pasa por: `https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback`
   - Llega a: `http://localhost:5173/auth/callback`

5. **Página muestra:**
   - Spinner: "Completing Sign In..."
   - Luego: ✅ "Success!"
   - Auto-redirige a home en 2 segundos

6. **En home:**
   - Status card muestra: "✅ User authenticated"
   - Consola muestra: User object con email, name, etc.

---

## 📸 Capturas de Referencia

### Supabase Dashboard - Providers List

Deberías ver algo como:
```
Providers
  Email          [Toggle ON]
  Phone          [Toggle OFF]
  ...
  LinkedIn       [Toggle ON] ✅ ← Este debe estar en ON
  ...
```

### Supabase Dashboard - LinkedIn Config

```
LinkedIn (OpenID Connect)

[Toggle ON] ✅ Enabled

Client ID: 86ioz1e0hnft46
Client Secret: •••••••••••••••••••••

Callback URL (for OAuth):
https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback

[Save] [Cancel]
```

### LinkedIn Developer Portal - Redirect URLs

```
Authorized redirect URIs for your app:

https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback ✅

[+ Add redirect URL]
```

---

## 💡 Tips Finales

1. **Espera 10-20 segundos** después de guardar en Supabase antes de probar
2. **Limpia caché del navegador** si persisten problemas (Ctrl+Shift+R)
3. **Usa modo incógnito** para probar sin sesiones previas
4. **Verifica scopes** si LinkedIn no devuelve email o profile
5. **Revisa la consola** siempre - ahí están los errores detallados

---

## 🚀 Una Vez Funcionando

Después de que LinkedIn OAuth funcione:

1. **Configurar Google OAuth** (proceso similar)
2. **Crear páginas de Sign Up / Sign In** completas
3. **Implementar onboarding flow**
4. **Conectar con base de datos** (crear user_profiles automáticamente)

---

**Tiempo estimado:** 5-10 minutos
**Dificultad:** Fácil (solo configuración, no código)

---

**¡Sigue estos pasos y el botón de LinkedIn funcionará! 🎯**
