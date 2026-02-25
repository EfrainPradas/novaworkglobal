# 🔗 LinkedIn OAuth Setup - CareerTipsAI

**Status:** Credentials configured, needs Supabase configuration
**LinkedIn Client ID:** 86ioz1e0hnft46
**LinkedIn Client Secret:** REDACTED_SECRET

---

## ✅ Paso 1: Configurar en LinkedIn Developer Portal

### 1.1 Verificar Redirect URIs

1. **Ir a LinkedIn Developer Portal:**
   ```
   https://www.linkedin.com/developers/apps
   ```

2. **Seleccionar tu app** (la que tiene Client ID: 86ioz1e0hnft46)

3. **En la pestaña "Auth":**
   - Click en "OAuth 2.0 settings"
   - Verificar/Agregar estos Redirect URLs:

   ```
   https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback
   ```

   Para desarrollo local (opcional):
   ```
   http://localhost:5173/auth/callback
   ```

4. **Guardar cambios**

### 1.2 Verificar Scopes (Permisos)

En la misma página "Auth", verificar que tienes estos scopes activados:

**Requeridos:**
- ✅ `openid` - Para autenticación
- ✅ `profile` - Para obtener nombre y foto
- ✅ `email` - Para obtener email del usuario

**Opcionales (para funcionalidades futuras):**
- `w_member_social` - Para compartir en LinkedIn (cuando implementes compartir logros)

---

## ✅ Paso 2: Configurar en Supabase Dashboard

### 2.1 Habilitar LinkedIn Provider

1. **Ir a Supabase Dashboard:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co
   ```

2. **Navegar a Authentication:**
   - Click en "Authentication" en el menú lateral izquierdo
   - Click en "Providers"

3. **Buscar LinkedIn:**
   - Scroll hasta encontrar "LinkedIn" en la lista de providers
   - Click en "LinkedIn"

4. **Habilitar LinkedIn:**
   - Toggle el switch para habilitar: **ON** ✅

5. **Configurar Credentials:**

   **LinkedIn Client ID:**
   ```
   86ioz1e0hnft46
   ```

   **LinkedIn Client Secret:**
   ```
   REDACTED_SECRET
   ```

6. **Copiar Redirect URL de Supabase:**

   Supabase mostrará algo como:
   ```
   https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback
   ```

   Esta URL ya debería estar agregada en LinkedIn (paso 1.1)

7. **Click "Save"**

### 2.2 Verificar Configuración

En la página de Providers, LinkedIn debe mostrar:
- Status: **Enabled** ✅
- Client ID: `86ioz1e0hnft46` ✅

---

## ✅ Paso 3: Actualizar Frontend (Agregar Botón)

Ahora vamos a agregar el botón de "Sign in with LinkedIn" en el frontend:

### 3.1 Crear Componente de LinkedIn Button

Ya tengo el código listo. Voy a crear los archivos necesarios.

---

## 🔍 Verificación

Después de configurar todo, verifica:

### En Supabase Dashboard:
1. Authentication → Providers → LinkedIn → **Enabled** ✅
2. Credentials configurados ✅

### En LinkedIn Developer Portal:
1. Redirect URL configurada ✅
2. Scopes configurados ✅

### En Frontend (después de crear componentes):
1. Botón "Sign in with LinkedIn" visible ✅
2. Click funciona y redirige a LinkedIn ✅

---

## 🎯 Expected Flow

1. Usuario hace click en "Sign in with LinkedIn"
2. Redirige a LinkedIn para autorización
3. Usuario acepta permisos
4. LinkedIn redirige de vuelta a Supabase callback
5. Supabase crea/actualiza usuario
6. Frontend recibe sesión activa
7. Usuario redirigido al dashboard

---

## 📋 Troubleshooting

### Error: "Invalid redirect_uri"
- Verificar que la URL en LinkedIn Developer Portal coincida EXACTAMENTE con la de Supabase
- No debe tener espacios ni caracteres extra
- Debe ser HTTPS (no HTTP)

### Error: "Invalid client credentials"
- Verificar Client ID y Secret en Supabase Dashboard
- Copiar/pegar de nuevo para evitar espacios

### Error: "Scope not authorized"
- Verificar que tu app tiene los scopes necesarios en LinkedIn
- Puede requerir review de LinkedIn para ciertos scopes

### LinkedIn no redirige de vuelta:
- Verificar que el redirect URI está configurado en LinkedIn
- Verificar que no hay errores en la consola del navegador

---

## 🔐 Scopes Explicados

**openid:**
- Permite autenticación OpenID Connect
- Obligatorio para OAuth 2.0

**profile:**
- Acceso a: nombre, foto de perfil, headline
- Usado para crear el perfil del usuario en CareerTipsAI

**email:**
- Acceso al email del usuario
- Necesario para identificar/crear cuenta

**w_member_social (futuro):**
- Permite publicar en nombre del usuario
- Útil para: compartir logros de búsqueda de empleo

---

## 📊 Data Flow

```
1. User clicks "Sign in with LinkedIn"
   ↓
2. Frontend calls: supabase.auth.signInWithOAuth({ provider: 'linkedin' })
   ↓
3. Redirects to: https://www.linkedin.com/oauth/v2/authorization?...
   ↓
4. User authorizes on LinkedIn
   ↓
5. LinkedIn redirects to: https://fytyfeapxgswxkecneom.supabase.co/auth/v1/callback
   ↓
6. Supabase exchanges code for token
   ↓
7. Supabase creates/updates user in auth.users
   ↓
8. Supabase redirects to: http://localhost:5173/auth/callback
   ↓
9. Frontend detects session and redirects to dashboard
```

---

## 🎨 LinkedIn Profile Data

Después de autenticación exitosa, tendrás acceso a:

```typescript
{
  sub: "linkedin-user-id",
  email: "user@example.com",
  name: "John Doe",
  given_name: "John",
  family_name: "Doe",
  picture: "https://media.licdn.com/dms/image/...",
  locale: "en-US"
}
```

---

## 🚀 Next Steps

Después de configurar LinkedIn OAuth:

1. **Configurar Google OAuth** (similar process)
2. **Crear páginas de autenticación** (Sign Up, Sign In)
3. **Implementar onboarding flow**
4. **Probar flujo completo de registro**

---

**Preparado por:** Claude Code
**Fecha:** 18 de Noviembre, 2025
**Estado:** ✅ Credentials ready, pending Supabase configuration
