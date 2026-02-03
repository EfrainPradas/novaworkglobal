# Frontend Setup Guide - CareerTipsAI

## ✅ Configuración Completada

- ✅ Credenciales de Supabase configuradas
- ✅ Project URL: https://fytyfeapxgswxkecneom.supabase.co
- ✅ Anon Key configurada en .env.local
- ✅ Google OAuth activado

## 🚀 Instalación Rápida

### 1. Instalar Dependencias

```bash
cd /home/efraiprada/carreerstips/frontend
npm install
```

### 2. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación se abrirá en: http://localhost:5173

## 📁 Estructura Creada

```
frontend/
├── .env.local              ✅ Variables de entorno (Supabase configurado)
├── package.json            ✅ Dependencias de React + Supabase
├── vite.config.ts          ✅ Configuración de Vite
├── tsconfig.json           ✅ TypeScript configurado
├── tailwind.config.js      ✅ Tailwind con colores de marca
├── postcss.config.js       ✅ PostCSS para Tailwind
├── index.html              ✅ HTML base con fuentes
└── src/
    └── lib/
        └── supabase.ts     ✅ Cliente de Supabase configurado
```

## 🔧 Configuración Supabase

### Cliente de Supabase
El cliente ya está configurado en `src/lib/supabase.ts`:

```typescript
import { supabase } from '@/lib/supabase'

// Ejemplo de uso:
const { data, error } = await supabase
  .from('users')
  .select('*')
  .limit(1)
```

### Helper Functions Disponibles

```typescript
import {
  getCurrentUser,
  getCurrentSession,
  isAuthenticated,
  signOut
} from '@/lib/supabase'

// Obtener usuario actual
const user = await getCurrentUser()

// Verificar autenticación
const isAuth = await isAuthenticated()

// Cerrar sesión
await signOut()
```

## 🎨 Tema y Colores

Colores de marca configurados en Tailwind:

```javascript
colors: {
  primary: '#007bff',      // Azul principal
  secondary: '#6c757d',    // Gris
  success: '#28a745',      // Verde
  warning: '#ffc107',      // Amarillo
  danger: '#dc3545',       // Rojo
}
```

Uso en componentes:
```tsx
<button className="bg-primary text-white hover:bg-primary-600">
  Button
</button>
```

## 📦 Dependencias Instaladas

### Core
- ✅ React 18.2
- ✅ React DOM 18.2
- ✅ TypeScript 5.2
- ✅ Vite 5.0

### Supabase
- ✅ @supabase/supabase-js (client)
- ✅ @supabase/auth-ui-react (auth components)
- ✅ @supabase/auth-ui-shared (auth utilities)

### Routing & State
- ✅ react-router-dom (navegación)
- ✅ zustand (state management)
- ✅ @tanstack/react-query (server state)

### Forms
- ✅ react-hook-form (form handling)
- ✅ zod (validation)
- ✅ @hookform/resolvers (integration)

### UI & Styling
- ✅ Tailwind CSS
- ✅ PostCSS
- ✅ Autoprefixer

### Charts & Visualization
- ✅ recharts (gráficas para dashboard)

### i18n
- ✅ react-i18next (internacionalización)
- ✅ i18next (core)

### Utilities
- ✅ date-fns (manejo de fechas)

## 🧪 Probar Conexión a Supabase

Crear archivo `src/test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase'

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')

  // Test 1: Check if client is initialized
  console.log('✅ Supabase client initialized')
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL)

  // Test 2: Try to query a table
  const { data, error } = await supabase
    .from('users')
    .select('count')
    .limit(1)

  if (error) {
    console.error('❌ Error querying database:', error.message)
  } else {
    console.log('✅ Database connection successful!')
    console.log('Data:', data)
  }

  // Test 3: Check auth session
  const { data: { session } } = await supabase.auth.getSession()
  console.log('Auth session:', session ? '✅ Active' : '⚠️ No active session')

  return { success: !error, error }
}
```

Llamar en `main.tsx`:
```typescript
import { testSupabaseConnection } from './test-supabase'

// En desarrollo, probar conexión
if (import.meta.env.DEV) {
  testSupabaseConnection()
}
```

## 🔐 Autenticación

### Sign Up con Email/Password

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe',
      preferred_language: 'en'
    }
  }
})
```

### Sign In con Email/Password

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})
```

### Sign In con Google OAuth

```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/auth/callback'
  }
})
```

### Escuchar Cambios de Autenticación

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  console.log('Session:', session)

  if (event === 'SIGNED_IN') {
    // Usuario inició sesión
  } else if (event === 'SIGNED_OUT') {
    // Usuario cerró sesión
  }
})
```

## 📊 Consultas a la Base de Datos

### Select

```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

### Insert

```typescript
const { data, error } = await supabase
  .from('resume_versions')
  .insert({
    user_id: userId,
    version_name: 'General Resume',
    resume_type: 'chronological'
  })
  .select()
  .single()
```

### Update

```typescript
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'New Name' })
  .eq('id', userId)
```

### Delete

```typescript
const { data, error } = await supabase
  .from('resume_versions')
  .delete()
  .eq('id', resumeId)
```

## 🗂️ Storage (Archivos)

### Subir Resume

```typescript
const file = event.target.files[0]
const fileName = `${userId}/resume_${Date.now()}.pdf`

const { data, error } = await supabase.storage
  .from('resumes')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Descargar Resume

```typescript
const { data, error } = await supabase.storage
  .from('resumes')
  .download(`${userId}/resume.pdf`)
```

### Obtener URL Pública (avatars)

```typescript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(`${userId}/avatar.jpg`)

const avatarUrl = data.publicUrl
```

## 🚀 Próximos Pasos

### 1. Crear Componentes Base (Sprint 1 - Semana 3)

```bash
src/
├── components/
│   ├── auth/
│   │   ├── SignUpForm.tsx
│   │   ├── SignInForm.tsx
│   │   └── AuthCallback.tsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx
│   │   ├── CareerClaritySnapshot.tsx
│   │   └── LanguageSelector.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/
│   ├── Landing.tsx
│   ├── SignUp.tsx
│   ├── SignIn.tsx
│   ├── Onboarding.tsx
│   └── Dashboard.tsx
└── routes/
    └── index.tsx
```

### 2. Configurar React Router

```bash
npm install react-router-dom
```

### 3. Crear Stores con Zustand

```typescript
// src/stores/auth.ts
import { create } from 'zustand'

interface AuthStore {
  user: User | null
  session: Session | null
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
}))
```

### 4. Configurar React Query

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
```

## 🐛 Troubleshooting

### Error: "Missing environment variables"
**Solución:** Verifica que `.env.local` existe y tiene las variables correctas

### Error: "Failed to fetch"
**Solución:** Verifica que la URL de Supabase es correcta y que el proyecto está activo

### Error: "Invalid API key"
**Solución:** Regenera el Anon Key en Supabase Dashboard → Settings → API

### OAuth no funciona
**Solución:**
1. Verifica redirect URLs en Google Cloud Console
2. Verifica Site URL en Supabase Dashboard → Authentication → Settings

## 📞 Recursos

- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Tailwind Docs:** https://tailwindcss.com

---

**Setup completado por:** Claude Code
**Fecha:** 18 de Noviembre, 2025
**Estado:** ✅ Listo para desarrollo
