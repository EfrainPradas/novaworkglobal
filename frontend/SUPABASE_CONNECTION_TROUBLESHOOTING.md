# Supabase Connection Troubleshooting

**Issue Detected:** "Invalid API key" error when connecting to Supabase

---

## 🔍 Current Situation

The frontend application is configured and running, but showing an "Invalid API key" error when attempting to query the database. This is expected behavior for a new Supabase project setup.

**Status:**
- ✅ Frontend running on http://localhost:5173
- ✅ Supabase client initialized correctly
- ✅ Environment variables configured in `.env.local`
- ⚠️ Database connection showing API key error
- ⚠️ No active user session (expected - no users created yet)

---

## 🛠️ Solution Steps

### Option 1: Verify API Key in Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co
   ```

2. **Navigate to Settings → API:**
   - Click "Settings" in the left sidebar
   - Click "API" section
   - Find the **"anon" / "public"** key

3. **Compare Keys:**
   - Current key in `.env.local`:
     ```
     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHlmZWFweGdzd3hrZWNuZW9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5Njk3NTQsImV4cCI6MjA0NzU0NTc1NH0.p8kLPNfSdDxvmAfCKaGDLDMWnr6gvBvkbQqHg5Y0Bl4
     ```
   - If different, copy the **correct anon key** from dashboard

4. **Update `.env.local` if needed:**
   ```bash
   # Edit the file
   nano /home/efraiprada/carreerstips/frontend/.env.local

   # Update this line with correct key:
   VITE_SUPABASE_ANON_KEY=your-correct-anon-key-here
   ```

5. **Restart dev server:**
   ```bash
   # Press Ctrl+C in terminal running dev server
   npm run dev
   ```

6. **Refresh browser** and verify connection

---

### Option 2: Create Database Tables via SQL Editor

The "Invalid API key" error might also occur if:
- Tables don't exist yet in the database
- RLS (Row Level Security) policies are blocking anonymous access

**Steps:**

1. **Open Supabase SQL Editor:**
   ```
   https://fytyfeapxgswxkecneom.supabase.co → SQL Editor
   ```

2. **Run the schema.sql file:**
   - Click "New query"
   - Copy contents from `/home/efraiprada/carreerstips/schema.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify tables created:**
   ```sql
   -- Check if tables exist
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

4. **Check RLS policies:**
   ```sql
   -- View RLS policies on users table
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

5. **Temporarily disable RLS for testing (optional):**
   ```sql
   -- ONLY for initial testing, re-enable after verification
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```

6. **Refresh the frontend** and check connection status

---

### Option 3: Enable Anonymous Access for Users Table

If tables exist but RLS is blocking access:

1. **Create a policy for anonymous read access:**
   ```sql
   -- Allow anonymous users to read users table (for testing)
   CREATE POLICY "Enable read access for anonymous users" ON users
     FOR SELECT
     USING (true);
   ```

2. **Or temporarily allow all operations:**
   ```sql
   -- For testing only - REMOVE in production!
   CREATE POLICY "Allow all for testing" ON users
     FOR ALL
     USING (true)
     WITH CHECK (true);
   ```

3. **Verify policy created:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

4. **Test connection** by refreshing the frontend

---

## 🔐 Understanding the Issue

### What's Happening

Supabase uses Row Level Security (RLS) to protect your data. By default:
- All tables have RLS **enabled**
- No policies = **no access** (even with valid API key)
- Anonymous requests (no user logged in) are blocked by default

This is **secure by design** - your data is protected until you explicitly allow access.

### Why This Is Good

- 🔒 **Security first:** Data is protected by default
- 🎯 **Explicit permissions:** You control exactly who can access what
- 🛡️ **Defense in depth:** Multiple layers of security

### The "Invalid API key" Message

This error message is sometimes misleading. It usually means:
1. ❌ API key is actually invalid/expired (rare)
2. ✅ API key is valid, but **RLS is blocking access** (most common)
3. ✅ API key is valid, but **table doesn't exist** (common for new projects)

---

## ✅ Expected Behavior After Fix

Once resolved, you should see:

1. **Supabase Client:** ✅ Initialized
2. **Database Connection:** ✅ Connected (with note about empty tables or RLS)
3. **Authentication Session:** ⚠️ No active session (expected)
4. **User Authentication:** ⚠️ Not authenticated (expected)

The warnings for session and authentication are **normal** - you haven't created any users yet!

---

## 🧪 Test Database Connection

Once you think it's fixed, test with this SQL query in Supabase SQL Editor:

```sql
-- Test 1: Check if users table exists
SELECT COUNT(*) FROM users;

-- Test 2: Check RLS status
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Test 3: Check existing policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users';
```

**Expected results:**
- Test 1: Should return `0` (empty table) or a count
- Test 2: Should show `rowsecurity = true`
- Test 3: Should list any RLS policies

---

## 📋 Quick Checklist

- [ ] Verified Supabase project URL is correct: `https://fytyfeapxgswxkecneom.supabase.co`
- [ ] Copied **anon key** from Supabase Dashboard → Settings → API
- [ ] Updated `.env.local` with correct anon key
- [ ] Restarted dev server (`Ctrl+C` then `npm run dev`)
- [ ] Ran `schema.sql` in SQL Editor to create tables
- [ ] Verified tables exist with `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
- [ ] Created RLS policies for `users` table (or temporarily disabled RLS for testing)
- [ ] Refreshed browser at http://localhost:5173
- [ ] Checked browser console for detailed error messages (F12 → Console)

---

## 🚀 Next Steps After Connection Works

Once the database connection is verified:

1. **Re-enable RLS if disabled:**
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ```

2. **Create proper RLS policies:**
   - See `/home/efraiprada/carreerstips/docs/supabase-setup-guide.md`
   - Section 3: "Row Level Security Policies"

3. **Begin Sprint 1 development:**
   - Create authentication pages (Sign Up, Sign In)
   - Implement user registration flow
   - Build onboarding UI

---

## 📞 Additional Resources

- **Supabase Dashboard:** https://fytyfeapxgswxkecneom.supabase.co
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Supabase API Docs:** https://supabase.com/docs/reference/javascript/introduction
- **Project Schema:** `/home/efraiprada/carreerstips/schema.sql`
- **Setup Guide:** `/home/efraiprada/carreerstips/docs/supabase-setup-guide.md`

---

## 🐛 Still Having Issues?

If the connection still fails after trying these steps:

1. **Check Supabase project status:**
   - Go to https://status.supabase.com
   - Verify no outages

2. **Verify project is not paused:**
   - Free tier projects pause after 7 days inactivity
   - Go to Dashboard → Settings → General
   - Click "Resume project" if needed

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Console tab
   - Look for detailed error messages
   - Copy full error for troubleshooting

4. **Verify network connectivity:**
   ```bash
   # Test if Supabase URL is reachable
   curl https://fytyfeapxgswxkecneom.supabase.co
   ```

5. **Try with a simple test:**
   ```typescript
   // Add to App.tsx temporarily
   console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
   console.log('Anon key (first 20 chars):', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20))
   ```

---

**Last Updated:** November 18, 2025
**Related Files:**
- `.env.local` - Environment variables
- `src/lib/supabase.ts` - Supabase client configuration
- `schema.sql` - Database schema
- `docs/supabase-setup-guide.md` - Complete Supabase setup guide
