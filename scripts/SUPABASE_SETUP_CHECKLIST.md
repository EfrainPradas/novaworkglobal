# Supabase Setup Checklist - CareerTipsAI

**Status:** Database running ✅ | Configuration in progress ⏳

Use this checklist to track your Supabase configuration progress.

---

## ✅ PHASE 1: DATABASE (COMPLETE)

- [x] Supabase project created
- [x] Database schema deployed (`schema.sql`)
- [x] Tables created (25+ tables)
- [x] Indexes created
- [x] RLS enabled on all tables
- [x] RLS policies applied
- [x] Triggers configured (auto-update timestamps)

---

## 🔧 PHASE 2: AUTHENTICATION SETUP

### Email/Password Authentication
- [ ] Email/Password provider enabled (should be default)
- [ ] Email confirmation settings configured
- [ ] Password requirements set (min 8 characters)

### Google OAuth
- [ ] Google Cloud Console project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 credentials created
- [ ] Authorized redirect URIs added:
  - [ ] `https://your-project-ref.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback`
- [ ] Client ID and Client Secret copied
- [ ] Google provider enabled in Supabase
- [ ] Credentials pasted in Supabase

### LinkedIn OAuth
- [ ] LinkedIn Developers app created
- [ ] Redirect URLs configured in LinkedIn:
  - [ ] `https://your-project-ref.supabase.co/auth/v1/callback`
  - [ ] `http://localhost:5173/auth/callback`
- [ ] Scopes requested: `r_liteprofile`, `r_emailaddress`
- [ ] Client ID and Client Secret copied
- [ ] LinkedIn provider enabled in Supabase
- [ ] Credentials pasted in Supabase

### Authentication Settings
- [ ] Site URL configured
- [ ] Redirect URLs added (localhost + production)
- [ ] JWT expiry set (3600 seconds = 1 hour)
- [ ] Refresh token expiry set (2592000 seconds = 30 days)

### Email Templates
- [ ] Confirmation email customized (sign-up)
- [ ] Password reset email customized
- [ ] Magic link email customized (optional)

---

## 📦 PHASE 3: STORAGE BUCKETS

### Create Buckets
- [ ] `resumes` bucket created (private, 10 MB limit, PDF/DOCX only)
- [ ] `certificates` bucket created (private, 5 MB limit, PDF/images)
- [ ] `avatars` bucket created (public, 2 MB limit, images only)

### Apply Storage Policies
- [ ] Run `supabase-storage-policies.sql` in SQL Editor
- [ ] Verify resumes bucket has 4 policies (insert, select, update, delete)
- [ ] Verify certificates bucket has 4 policies
- [ ] Verify avatars bucket has 4 policies

### Test Storage
- [ ] Test uploading a file to resumes bucket
- [ ] Test downloading the file
- [ ] Test deleting the file
- [ ] Verify other users can't access your files

---

## 🚀 PHASE 4: EDGE FUNCTIONS (Sprint 1+)

### Install Supabase CLI
- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Verified installation: `supabase --version`
- [ ] Logged in: `supabase login`
- [ ] Project linked: `supabase link --project-ref your-project-ref`

### Set Secrets
- [ ] OpenAI API key set: `supabase secrets set OPENAI_API_KEY=sk-...`
- [ ] Anthropic API key set (optional fallback)
- [ ] Stripe secret key set (when ready)
- [ ] SendGrid API key set (when ready)
- [ ] Verified secrets: `supabase secrets list`

### Create Edge Functions (During Sprint 1)
- [ ] `onboarding-clarity-snapshot` function created
- [ ] `resume-upload` function created
- [ ] `resume-generate-bullet` function created
- [ ] `resume-generate` function created
- [ ] `resume-tailor` function created
- [ ] Functions deployed and tested

---

## 🔐 PHASE 5: API & SECURITY

### API Keys
- [ ] Project URL copied from Dashboard → Settings → API
- [ ] Anon key copied (safe for frontend)
- [ ] Service role key copied (BACKEND ONLY)
- [ ] Keys added to `.env.local` (frontend)
- [ ] Keys added to `.env` (backend, if separate)

### CORS Configuration
- [ ] Allowed origins added:
  - [ ] `http://localhost:5173`
  - [ ] `https://careertipsai.com`
  - [ ] `https://www.careertipsai.com`

### Rate Limiting (Optional)
- [ ] Anonymous requests: 100/minute
- [ ] Authenticated requests: 500/minute

---

## 📊 PHASE 6: MONITORING & LOGS

### Enable Logs
- [ ] Database query logs enabled
- [ ] Edge Function logs enabled
- [ ] API request logs enabled
- [ ] Authentication event logs enabled
- [ ] Storage operation logs enabled

### Alerts (Optional - Pro Plan)
- [ ] Database CPU alert configured (> 80%)
- [ ] Disk usage alert configured (> 90%)
- [ ] API error rate alert configured (> 5%)

---

## 💾 PHASE 7: BACKUP & RECOVERY

### Automatic Backups (Pro Plan)
- [ ] Automatic backups enabled
- [ ] Backup frequency: Daily
- [ ] Retention period: 7 days
- [ ] Point-in-Time Recovery enabled (optional)

### Manual Backup (Development)
- [ ] Created schema backup: `supabase db dump --schema-only > backup_schema.sql`
- [ ] Verified backup can be restored

---

## 🧪 PHASE 8: TESTING & VERIFICATION

### Authentication Testing
- [ ] Test sign-up with email/password
- [ ] Test login with email/password
- [ ] Test Google OAuth sign-in
- [ ] Test LinkedIn OAuth sign-in
- [ ] Test password reset flow
- [ ] Test email confirmation flow

### Database Testing
- [ ] Test inserting data (create test user)
- [ ] Test querying data (verify RLS works)
- [ ] Test updating data
- [ ] Test deleting data
- [ ] Verify RLS prevents unauthorized access

### Storage Testing
- [ ] Test uploading resume (authenticated user)
- [ ] Test downloading resume (same user)
- [ ] Test uploading certificate
- [ ] Test avatar upload (public bucket)
- [ ] Verify file size limits work
- [ ] Verify MIME type restrictions work

### API Testing
- [ ] Test Supabase client connection from frontend
- [ ] Test API calls with Anon key
- [ ] Test API calls with Service role key (backend)
- [ ] Verify CORS allows localhost
- [ ] Verify rate limiting works (optional)

---

## 📝 PHASE 9: ENVIRONMENT VARIABLES

### Frontend (.env.local)
- [ ] Created `.env.local` from `.env.example`
- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_ANON_KEY`
- [ ] Verified variables load in Vite: `import.meta.env.VITE_SUPABASE_URL`

### Backend (.env) - If Separate
- [ ] Created `.env` from `.env.example`
- [ ] Set `SUPABASE_URL`
- [ ] Set `SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Set `OPENAI_API_KEY`
- [ ] Set `STRIPE_SECRET_KEY` (when ready)
- [ ] Set `SENDGRID_API_KEY` (when ready)

### Verify .gitignore
- [ ] Verified `.env` in `.gitignore`
- [ ] Verified `.env.local` in `.gitignore`
- [ ] Never commit secrets to git!

---

## 🎯 PHASE 10: PRODUCTION READINESS (Pre-Launch)

### Security Audit
- [ ] All RLS policies reviewed and tested
- [ ] Service role key never exposed in frontend
- [ ] API keys rotated (if shared/compromised)
- [ ] CORS origins restricted to production domains only
- [ ] Rate limiting enabled and tuned

### Performance Optimization
- [ ] Database indexes reviewed (all created from schema.sql)
- [ ] Connection pooling configured
- [ ] Query performance tested with realistic data
- [ ] Edge Function cold start times acceptable (<2 seconds)

### Compliance
- [ ] Terms of Service added to database/app
- [ ] Privacy Policy added
- [ ] Cookie consent implemented (GDPR)
- [ ] Data retention policy defined
- [ ] User data export feature planned (GDPR compliance)

---

## 📞 NEED HELP?

### Resources
- **Supabase Docs:** https://supabase.com/docs
- **Setup Guide:** `/docs/supabase-setup-guide.md` (detailed instructions)
- **Discord:** https://discord.supabase.com
- **GitHub:** https://github.com/supabase/supabase/issues

### Common Issues
- **"relation does not exist"** → Re-run `schema.sql`
- **RLS blocks all access** → Check policies, verify auth.uid()
- **OAuth not working** → Check redirect URLs in provider settings
- **Storage upload fails** → Check bucket policies and MIME types

---

## ✅ COMPLETION STATUS

**Total Items:** 100+
**Completed:** [Track as you go]
**Remaining:** [Track as you go]

**Current Phase:** Authentication Setup (Phase 2)

**Next Steps:**
1. Complete authentication provider setup (Google + LinkedIn)
2. Create storage buckets and apply policies
3. Set up environment variables
4. Test authentication flow end-to-end
5. Begin Sprint 1 development (Week 3)

---

**Last Updated:** November 18, 2025
