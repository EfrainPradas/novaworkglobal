# 🚀 CareerTipsAI - Quick Start Guide

**Last Updated:** November 18, 2025
**Status:** ✅ Phase 0 Complete - Ready for Development

---

## ⚡ Start Development (Right Now!)

The development server is already running! Open your browser:

```
http://localhost:5173
```

You'll see the connection test page showing:
- ✅ Supabase client initialized
- ✅ Database connection verified
- ✅ Authentication ready
- ✅ Frontend configured

---

## 📊 What's Been Completed

### ✅ Phase 0 (100% Complete)
- ✅ Requirements document (27,600 words)
- ✅ Database schema (25+ tables deployed)
- ✅ Supabase configured (https://fytyfeapxgswxkecneom.supabase.co)
- ✅ Frontend setup (React + TypeScript + Vite + Tailwind)
- ✅ 343 npm packages installed
- ✅ Development server running
- ✅ Google OAuth activated
- ✅ Brand colors configured (#007bff)
- ✅ Fonts configured (Manrope + Nunito Sans)

---

## 🎯 Sprint 1 Tasks (Next 2 Weeks)

### Week 3: Authentication UI
Create pages and components for:
- [ ] Sign Up page (email/password)
- [ ] Sign In page (email/password)
- [ ] Google OAuth button
- [ ] Password reset flow
- [ ] Auth context/store (Zustand)
- [ ] Protected routes

**Files to create:**
```
frontend/src/
├── pages/
│   ├── auth/
│   │   ├── SignUp.tsx
│   │   ├── SignIn.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   └── AuthCallback.tsx
├── components/
│   └── auth/
│       ├── AuthForm.tsx
│       ├── SocialAuthButton.tsx
│       └── AuthLayout.tsx
└── stores/
    └── authStore.ts
```

### Week 4: Onboarding Flow
Create pages for:
- [ ] Welcome/intro
- [ ] Language selector (EN/ES/PT/FR)
- [ ] Career Clarity Snapshot™ questionnaire
- [ ] Profile setup
- [ ] Goal setting (30/60/90 day)

**Files to create:**
```
frontend/src/
├── pages/
│   └── onboarding/
│       ├── Welcome.tsx
│       ├── LanguageSelection.tsx
│       ├── CareerClarity.tsx
│       ├── ProfileSetup.tsx
│       └── GoalSetting.tsx
└── components/
    └── onboarding/
        ├── StepIndicator.tsx
        ├── ProgressBar.tsx
        └── FormSection.tsx
```

---

## 💻 Essential Commands

### Development
```bash
# Navigate to frontend
cd /home/efraiprada/carreerstips/frontend

# Start dev server (if not running)
npm run dev

# Stop dev server
# Press Ctrl+C in the terminal

# Build for production
npm run build

# Preview production build
npm run preview
```

### Supabase
```bash
# View Supabase dashboard
# Open: https://fytyfeapxgswxkecneom.supabase.co

# Environment variables are in:
frontend/.env.local
```

---

## 📁 Key Files & Locations

### Documentation
- **Requirements:** `/home/efraiprada/carreerstips/docs/requirements-v3-FINAL.md`
- **Database Schema:** `/home/efraiprada/carreerstips/schema.sql`
- **Supabase Guide:** `/home/efraiprada/carreerstips/docs/supabase-setup-guide.md`
- **Frontend Guide:** `/home/efraiprada/carreerstips/frontend/SETUP.md`
- **Phase 0 Status:** `/home/efraiprada/carreerstips/PHASE_0_COMPLETE.md`

### Configuration
- **Environment:** `/home/efraiprada/carreerstips/frontend/.env.local`
- **Package:** `/home/efraiprada/carreerstips/frontend/package.json`
- **Vite:** `/home/efraiprada/carreerstips/frontend/vite.config.ts`
- **Tailwind:** `/home/efraiprada/carreerstips/frontend/tailwind.config.js`
- **TypeScript:** `/home/efraiprada/carreerstips/frontend/tsconfig.json`

### Source Code
- **Main Entry:** `/home/efraiprada/carreerstips/frontend/src/main.tsx`
- **App Component:** `/home/efraiprada/carreerstips/frontend/src/App.tsx`
- **Supabase Client:** `/home/efraiprada/carreerstips/frontend/src/lib/supabase.ts`
- **Styles:** `/home/efraiprada/carreerstips/frontend/src/index.css`

---

## 🎨 Brand Guidelines

### Colors (Tailwind)
```tsx
// Primary (CareerTipsAI Blue)
className="bg-primary text-white"
className="text-primary-600"

// Secondary (Gray)
className="bg-secondary text-white"

// Success (Green)
className="text-success"

// Warning (Yellow)
className="text-warning"

// Danger (Red)
className="text-danger"
```

### Fonts
```tsx
// Headings
className="font-heading font-bold"

// Body text
className="font-body"

// Default (uses Nunito Sans)
<p className="text-base">Body text</p>
```

---

## 🔌 Supabase Usage Examples

### Authentication
```typescript
import { supabase } from '@/lib/supabase'

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
})

// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
})

// Sign out
await supabase.auth.signOut()
```

### Database Queries
```typescript
// Select
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()

// Insert
const { data, error } = await supabase
  .from('user_profiles')
  .insert({
    user_id: userId,
    full_name: 'John Doe',
    preferred_language: 'en'
  })
  .select()
  .single()

// Update
const { data, error } = await supabase
  .from('users')
  .update({ full_name: 'New Name' })
  .eq('id', userId)
```

### Storage (File Upload)
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

---

## 🧩 Component Structure Example

```tsx
// Example: Sign Up page
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: '',
          preferred_language: 'en'
        }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      // Redirect to onboarding
      window.location.href = '/onboarding'
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-heading font-bold text-primary-600 mb-6">
          Create Account
        </h1>

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 mb-4">
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6">
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
          >
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## 🐛 Troubleshooting

### Dev server won't start
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill process if needed
kill -9 <PID>

# Restart
npm run dev
```

### Supabase connection issues
1. Check `.env.local` exists in `/home/efraiprada/carreerstips/frontend/`
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Check Supabase dashboard is accessible: https://fytyfeapxgswxkecneom.supabase.co

### TypeScript errors
```bash
# Regenerate type definitions
npm run build

# Check tsconfig.json is correct
cat tsconfig.json
```

### Tailwind classes not working
1. Verify `tailwind.config.js` exists
2. Check `index.css` has `@tailwind` directives
3. Restart dev server

---

## 📞 Resources

### Documentation
- **Project README:** `/home/efraiprada/carreerstips/README.md`
- **Requirements (complete):** `/home/efraiprada/carreerstips/docs/requirements-v3-FINAL.md`
- **Supabase Setup:** `/home/efraiprada/carreerstips/docs/supabase-setup-guide.md`

### External Links
- **Supabase Dashboard:** https://fytyfeapxgswxkecneom.supabase.co
- **Supabase Docs:** https://supabase.com/docs
- **React Docs:** https://react.dev
- **Vite Docs:** https://vitejs.dev
- **Tailwind Docs:** https://tailwindcss.com

---

## ✅ Phase 0 Complete!

Everything is ready. Start coding! 🎉

**Development server:** http://localhost:5173
**Supabase dashboard:** https://fytyfeapxgswxkecneom.supabase.co

---

**Prepared by:** Claude Code
**Date:** November 18, 2025
