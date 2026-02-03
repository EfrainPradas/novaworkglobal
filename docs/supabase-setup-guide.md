# Supabase Setup Guide - CareerTipsAI

**Version:** 1.0
**Date:** November 18, 2025
**Status:** Initial Configuration

---

## 📋 Overview

This guide walks through the complete Supabase configuration for CareerTipsAI, including:
- Authentication setup (Email/Password, Google OAuth, LinkedIn OAuth)
- Row-Level Security (RLS) policies
- Storage buckets for resumes and certificates
- Edge Functions deployment
- Environment variables and secrets

---

## 1. AUTHENTICATION CONFIGURATION

### 1.1 Enable Authentication Providers

**Location:** Supabase Dashboard → Authentication → Providers

#### Email/Password (Already Enabled by Default)
✅ This should already be enabled

#### Google OAuth

1. **Go to Google Cloud Console:** https://console.cloud.google.com/
2. **Create a new project** (or select existing): `CareerTipsAI`
3. **Enable Google+ API:**
   - Navigate to: APIs & Services → Library
   - Search: "Google+ API"
   - Click: Enable

4. **Create OAuth 2.0 Credentials:**
   - APIs & Services → Credentials
   - Click: Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: `CareerTipsAI Supabase Auth`
   - Authorized JavaScript origins:
     ```
     https://your-project-ref.supabase.co
     http://localhost:5173
     ```
   - Authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
   - Click: Create
   - Copy: **Client ID** and **Client Secret**

5. **Configure in Supabase:**
   - Supabase Dashboard → Authentication → Providers → Google
   - Toggle: **Enable**
   - Paste: Client ID and Client Secret
   - Click: Save

#### LinkedIn OAuth

1. **Go to LinkedIn Developers:** https://www.linkedin.com/developers/
2. **Create an app:**
   - Click: Create app
   - App name: `CareerTipsAI`
   - LinkedIn Page: Create a company page or use personal
   - App logo: Upload logo from `/assets/brand/logo.png`
   - Click: Create app

3. **Configure OAuth 2.0 settings:**
   - Go to: Auth tab
   - Add Authorized redirect URLs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     http://localhost:5173/auth/callback
     ```
   - Request access to: `r_liteprofile`, `r_emailaddress`
   - Copy: **Client ID** and **Client Secret**

4. **Configure in Supabase:**
   - Supabase Dashboard → Authentication → Providers → LinkedIn
   - Toggle: **Enable**
   - Paste: Client ID and Client Secret
   - Scopes: `r_liteprofile r_emailaddress`
   - Click: Save

### 1.2 Configure Authentication Settings

**Location:** Supabase Dashboard → Authentication → Settings

```yaml
Site URL: https://careertipsai.com (or http://localhost:5173 for dev)

Redirect URLs (comma-separated):
  - http://localhost:5173/**
  - https://careertipsai.com/**
  - https://www.careertipsai.com/**

JWT Expiry: 3600 (1 hour)
Refresh Token Expiry: 2592000 (30 days)

Email Auth:
  - Enable email confirmations: YES (for production)
  - Enable email confirmations: NO (for development testing)
  - Secure email change: YES
  - Double confirm email changes: YES

Password Requirements:
  - Minimum password length: 8 characters
  - Require uppercase: NO (keep simple for MVP)
  - Require lowercase: NO
  - Require numbers: NO
  - Require special characters: NO
```

### 1.3 Email Templates

**Location:** Supabase Dashboard → Authentication → Email Templates

#### Confirmation Email (Sign Up)
```html
<h2>Welcome to CareerTipsAI! 🎉</h2>

<p>Hi there,</p>

<p>Thanks for signing up for CareerTipsAI - your AI-powered career transformation platform.</p>

<p>Please confirm your email address by clicking the button below:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Email</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link expires in 24 hours.</p>

<p>If you didn't sign up for CareerTipsAI, you can safely ignore this email.</p>

<p>Best regards,<br>
The CareerTipsAI Team</p>

<hr>
<p style="font-size: 12px; color: #6c757d;">
CareerTipsAI - Human Experience + Intelligent Tools<br>
Your Reinvention, Accelerated
</p>
```

#### Password Reset Email
```html
<h2>Reset Your CareerTipsAI Password</h2>

<p>Hi there,</p>

<p>We received a request to reset your password for your CareerTipsAI account.</p>

<p>Click the button below to reset your password:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link expires in 1 hour.</p>

<p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

<p>Best regards,<br>
The CareerTipsAI Team</p>

<hr>
<p style="font-size: 12px; color: #6c757d;">
CareerTipsAI - Human Experience + Intelligent Tools
</p>
```

#### Magic Link Email
```html
<h2>Your CareerTipsAI Magic Link</h2>

<p>Hi there,</p>

<p>Click the button below to sign in to your CareerTipsAI account:</p>

<p><a href="{{ .ConfirmationURL }}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In</a></p>

<p>Or copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>This link expires in 1 hour.</p>

<p>If you didn't request this magic link, you can safely ignore this email.</p>

<p>Best regards,<br>
The CareerTipsAI Team</p>
```

---

## 2. STORAGE CONFIGURATION

### 2.1 Create Storage Buckets

**Location:** Supabase Dashboard → Storage

Create the following buckets:

#### Bucket 1: `resumes`
```yaml
Name: resumes
Public: NO (private)
File size limit: 10 MB
Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**RLS Policy for `resumes` bucket:**

```sql
-- Users can upload their own resumes
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own resumes
CREATE POLICY "Users can read own resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own resumes
CREATE POLICY "Users can update own resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Bucket 2: `certificates`
```yaml
Name: certificates
Public: NO (private)
File size limit: 5 MB
Allowed MIME types: application/pdf, image/jpeg, image/png
```

**RLS Policy for `certificates` bucket:** (same as resumes)

```sql
-- Users can upload their own certificates
CREATE POLICY "Users can upload own certificates"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own certificates
CREATE POLICY "Users can read own certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own certificates
CREATE POLICY "Users can delete own certificates"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'certificates' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Bucket 3: `avatars`
```yaml
Name: avatars
Public: YES (public access for profile photos)
File size limit: 2 MB
Allowed MIME types: image/jpeg, image/png, image/webp
```

**RLS Policy for `avatars` bucket:**

```sql
-- Users can upload their own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Anyone can view avatars (public bucket)
CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## 3. EDGE FUNCTIONS SETUP

### 3.1 Install Supabase CLI

```bash
# Install Supabase CLI globally
npm install -g supabase

# Verify installation
supabase --version

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref
```

### 3.2 Initialize Edge Functions

```bash
# Navigate to project root
cd /home/efraiprada/carreerstips

# Initialize Edge Functions structure
supabase functions new onboarding-clarity-snapshot
supabase functions new resume-upload
supabase functions new resume-generate-bullet
supabase functions new resume-generate
supabase functions new resume-tailor
supabase functions new jobs-parse
supabase functions new interview-validate-star
supabase functions new journal-entry
```

### 3.3 Set Secrets for Edge Functions

```bash
# OpenAI API Key (primary AI provider)
supabase secrets set OPENAI_API_KEY=sk-...

# Anthropic API Key (fallback AI provider)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Stripe Secret Key (payments)
supabase secrets set STRIPE_SECRET_KEY=sk_test_...

# SendGrid API Key (emails)
supabase secrets set SENDGRID_API_KEY=SG...

# Verify secrets are set
supabase secrets list
```

### 3.4 Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy onboarding-clarity-snapshot
supabase functions deploy resume-upload
supabase functions deploy resume-generate-bullet
supabase functions deploy resume-generate
supabase functions deploy resume-tailor
supabase functions deploy jobs-parse
supabase functions deploy interview-validate-star
supabase functions deploy journal-entry

# Check deployment status
supabase functions list
```

---

## 4. DATABASE CONFIGURATION

### 4.1 Enable Required Extensions

```sql
-- Already included in schema.sql, but verify:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for encryption if needed
```

### 4.2 Set Up Database Webhooks (Optional)

**For real-time notifications when data changes**

**Location:** Supabase Dashboard → Database → Webhooks

Example webhook for new job applications:

```yaml
Name: new-job-application-webhook
Table: job_applications
Events: INSERT
Type: HTTP Request
URL: https://your-api.com/webhooks/new-application
Method: POST
Headers:
  Authorization: Bearer your-webhook-secret
```

### 4.3 Configure Connection Pooling (Production)

**Location:** Supabase Dashboard → Settings → Database

```yaml
Pool Mode: Transaction (recommended for most use cases)
Pool Size: 15 (default, adjust based on load)
Max Client Connections: 100
```

---

## 5. API CONFIGURATION

### 5.1 Get Your API Keys

**Location:** Supabase Dashboard → Settings → API

Copy these values:

```bash
# Project URL
SUPABASE_URL=https://your-project-ref.supabase.co

# Anon (Public) Key - safe to use in frontend
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Key - NEVER expose in frontend, server-side only
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.2 Configure CORS (if needed)

**Location:** Supabase Dashboard → Settings → API → CORS

Add allowed origins:
```
http://localhost:5173
https://careertipsai.com
https://www.careertipsai.com
```

---

## 6. ENVIRONMENT VARIABLES SETUP

### 6.1 Frontend Environment Variables

Create `/home/efraiprada/carreerstips/frontend/.env.local`:

```bash
# Supabase
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Environment
VITE_ENV=development

# API Endpoints (if separate backend)
VITE_API_URL=http://localhost:5000
```

### 6.2 Backend Environment Variables (if separate backend)

Create `/home/efraiprada/carreerstips/backend/.env`:

```bash
# Supabase
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@careertipsai.com

# Environment
NODE_ENV=development
PORT=5000
```

---

## 7. SECURITY CONFIGURATION

### 7.1 Enable RLS on All Tables

**Verify RLS is enabled** (should be from schema.sql):

```sql
-- Check RLS status for all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- If any table shows rowsecurity = false, enable it:
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### 7.2 Review and Test RLS Policies

```sql
-- Test as authenticated user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claims.sub = 'test-user-uuid';

-- Try to select data
SELECT * FROM users;
SELECT * FROM resume_versions;
SELECT * FROM job_applications;

-- Should only return data for test-user-uuid

-- Reset role
RESET role;
```

### 7.3 Configure Rate Limiting (Optional)

**Location:** Supabase Dashboard → Settings → API

```yaml
Rate Limiting:
  - Anonymous requests: 100/minute
  - Authenticated requests: 500/minute
```

---

## 8. MONITORING & LOGGING

### 8.1 Enable Logs

**Location:** Supabase Dashboard → Logs

Enable logs for:
- ✅ Database queries
- ✅ Edge Functions
- ✅ API requests
- ✅ Authentication events
- ✅ Storage operations

### 8.2 Set Up Alerts (Optional)

**Location:** Supabase Dashboard → Settings → Alerts

Configure alerts for:
- Database CPU > 80%
- Database Disk > 90%
- API error rate > 5%
- Edge Function failures

---

## 9. BACKUP & RECOVERY

### 9.1 Enable Automatic Backups

**Location:** Supabase Dashboard → Settings → Backups

```yaml
Automatic Backups: Enabled (Pro plan required)
Backup Frequency: Daily
Retention Period: 7 days
Point-in-Time Recovery: Enabled (Pro plan)
```

### 9.2 Manual Backup (Development)

```bash
# Export schema
supabase db dump --schema-only > backup_schema.sql

# Export data
supabase db dump --data-only > backup_data.sql

# Full backup
supabase db dump > backup_full.sql
```

---

## 10. VERIFICATION CHECKLIST

Run through this checklist to ensure everything is configured:

### Authentication
- [ ] Email/Password authentication enabled
- [ ] Google OAuth configured and tested
- [ ] LinkedIn OAuth configured and tested
- [ ] Email templates customized
- [ ] Redirect URLs configured
- [ ] JWT expiry set appropriately

### Storage
- [ ] `resumes` bucket created (private)
- [ ] `certificates` bucket created (private)
- [ ] `avatars` bucket created (public)
- [ ] RLS policies applied to all buckets
- [ ] File size limits configured

### Database
- [ ] All tables created from schema.sql
- [ ] RLS enabled on all tables
- [ ] RLS policies tested
- [ ] Indexes created
- [ ] Triggers working (updated_at auto-update)

### API & Security
- [ ] API keys copied to environment variables
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Service role key kept secure (never in frontend)

### Edge Functions
- [ ] Supabase CLI installed and logged in
- [ ] Project linked locally
- [ ] Secrets set for all API keys
- [ ] Functions deployed (will deploy in Sprint 1)

### Monitoring
- [ ] Logs enabled
- [ ] Alerts configured (optional for MVP)
- [ ] Backup strategy in place

---

## 11. NEXT STEPS

After completing this setup:

1. **Test Authentication Flow:**
   ```bash
   cd frontend
   npm install
   npm run dev
   # Test sign-up, login, OAuth flows
   ```

2. **Test Database Connection:**
   ```javascript
   // In frontend/src/test-supabase.js
   import { createClient } from '@supabase/supabase-js'

   const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )

   // Test query
   const { data, error } = await supabase.from('users').select('*').limit(1)
   console.log('Test query:', data, error)
   ```

3. **Start Sprint 1 Development:**
   - Build authentication UI
   - Implement onboarding flow
   - Create Career Clarity Snapshot AI function

---

## 12. TROUBLESHOOTING

### Issue: "relation does not exist" errors

**Solution:** Verify schema was applied correctly
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Issue: RLS prevents all access

**Solution:** Check policies and verify user is authenticated
```sql
-- View all policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Test with service role (bypasses RLS)
-- Use SUPABASE_SERVICE_ROLE_KEY in backend only
```

### Issue: OAuth redirect not working

**Solution:**
1. Check redirect URLs in OAuth provider (Google/LinkedIn)
2. Verify Site URL in Supabase Auth settings
3. Check browser console for CORS errors

### Issue: Storage upload fails

**Solution:**
1. Check bucket exists and RLS policies are correct
2. Verify file MIME type is allowed
3. Check file size limit

---

## 📞 Support Resources

- **Supabase Docs:** https://supabase.com/docs
- **Supabase Discord:** https://discord.supabase.com
- **GitHub Issues:** https://github.com/supabase/supabase/issues

---

**Configuration Guide v1.0 - Created November 18, 2025**
