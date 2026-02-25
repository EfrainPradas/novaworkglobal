# CareerTipsAI - Monthly Costs Analysis

**Document Created:** November 23, 2025
**Last Updated:** November 23, 2025
**Purpose:** Complete breakdown of monthly operational expenses

---

## 📊 EXECUTIVE SUMMARY

### Total Monthly Costs by Phase

| Phase | Users | Monthly Cost | Cost per User |
|-------|-------|--------------|---------------|
| **Development** | 1-10 | $25 - $50 | $2.50 - $5.00 |
| **Launch (Beta)** | 10-100 | $75 - $125 | $0.75 - $1.25 |
| **Growth** | 100-500 | $175 - $275 | $0.35 - $0.55 |
| **Scale** | 500-2,000 | $375 - $575 | $0.19 - $0.29 |
| **Enterprise** | 2,000+ | $800 - $1,200 | $0.15 - $0.24 |

---

## 💰 DETAILED COST BREAKDOWN

### 1. DATABASE HOSTING (Supabase)

**Provider:** Supabase (PostgreSQL + Authentication + Storage)
**Current Project:** `fytyfeapxgswxkecneom.supabase.co`

#### Pricing Tiers:

**Free Tier (Current - Development)**
- **Cost:** $0/month
- **Limits:**
  - 500 MB database
  - 1 GB file storage
  - 2 GB bandwidth
  - 50,000 monthly active users
  - Paused after 1 week of inactivity
- **Best for:** Development, testing, early MVP (1-50 users)

**Pro Tier (Recommended for Launch)**
- **Cost:** $25/month
- **Includes:**
  - 8 GB database
  - 100 GB file storage
  - 50 GB bandwidth
  - No project pausing
  - Daily backups
  - 7-day log retention
- **Best for:** Launch phase (50-500 users)

**Team Tier (Growth Phase)**
- **Cost:** $599/month
- **Includes:**
  - 100 GB database
  - 200 GB file storage
  - 250 GB bandwidth
  - SSO authentication
  - Priority support
- **Best for:** 500-2,000 users

**Enterprise Tier (Scale Phase)**
- **Cost:** Custom pricing (estimate $1,000-$2,500/month)
- **Includes:**
  - Dedicated infrastructure
  - Custom storage/bandwidth
  - SLA guarantees
  - Enterprise support
- **Best for:** 2,000+ users

#### Database Analysis:
- **Schema complexity:** 742 lines SQL, 20+ tables
- **Estimated storage per user:** ~5-10 MB (profile, resumes, accomplishments, job applications)
- **Growth projection:**
  - 100 users = 500 MB - 1 GB (Free tier sufficient)
  - 500 users = 2.5 - 5 GB (Pro tier required)
  - 2,000 users = 10 - 20 GB (Team tier required)

**Recommendation:** Start with Free tier, upgrade to Pro at 50 users or when approaching 500 MB storage.

---

### 2. FILE STORAGE (Supabase Storage)

**What's Stored:**
- Methodology videos: 67 MB (IMR-EN.mp4 + BRE-EN.mp4)
- User uploaded resumes: ~200 KB per user (PDF)
- Profile photos: ~100 KB per user
- Generated resume PDFs: ~150 KB per user

**Storage Growth Projection:**

| Users | Methodology Videos | User Files | Total Storage |
|-------|-------------------|------------|---------------|
| 100 | 67 MB | 45 MB | ~110 MB |
| 500 | 67 MB | 225 MB | ~290 MB |
| 1,000 | 67 MB | 450 MB | ~520 MB |
| 2,000 | 67 MB | 900 MB | ~970 MB |

**Cost:**
- Free tier: 1 GB (sufficient for 0-1,000 users)
- Pro tier: 100 GB (included in $25/month)
- Additional storage: $0.021 per GB/month

---

### 3. API COSTS

#### 3.1 OpenAI API (GPT-4o-mini)

**Current Implementation:**
- `/home/efraiprada/carreerstips/frontend/src/lib/openaiService.ts`
- Model: `gpt-4o-mini`

**Use Cases:**
1. **JD Keyword Extraction** - Extracts 15 ATS keywords from job description
   - Estimated tokens per request: 1,500 input + 500 output
   - Max tokens: 2,000 output

2. **Resume Match Analysis** - Analyzes resume against keywords
   - Estimated tokens per request: 2,000 input + 500 output
   - Max tokens: 2,000 output

**OpenAI GPT-4o-mini Pricing:**
- **Input:** $0.150 per 1M tokens
- **Output:** $0.600 per 1M tokens

**Cost per User Action:**

| Action | Input Tokens | Output Tokens | Cost per Request |
|--------|-------------|---------------|------------------|
| JD Analysis | 1,500 | 500 | $0.00052 |
| Resume Match | 2,000 | 500 | $0.00060 |
| **Total per job application** | 3,500 | 1,000 | **$0.00112** |

**Monthly Cost Estimates:**

| Users | Avg Jobs Analyzed | Total Requests | Monthly Cost |
|-------|------------------|----------------|--------------|
| 10 | 5/month | 50 | $0.06 |
| 100 | 10/month | 1,000 | $1.12 |
| 500 | 15/month | 7,500 | $8.40 |
| 1,000 | 20/month | 20,000 | $22.40 |
| 2,000 | 25/month | 50,000 | $56.00 |

**Safety Buffer:** Add 30% for retries, errors, testing = **$1.50 - $75/month**

---

#### 3.2 SerpAPI (Google Jobs Search)

**Current Implementation:**
- `/home/efraiprada/carreerstips/backend/routes/jobSearch.js`
- Endpoint: `POST /api/jobs/search`

**Use Case:** Real-time job search integration for Company Shortlist feature

**SerpAPI Pricing:**

| Tier | Searches/Month | Cost | Best For |
|------|---------------|------|----------|
| **Free** | 100 | $0 | Development, testing |
| **Developer** | 5,000 | $50 | Launch (100-500 users) |
| **Production** | 15,000 | $150 | Growth (500-2,000 users) |
| **Enterprise** | 30,000+ | Custom | Scale (2,000+ users) |

**Usage Estimates:**

| Users | Searches per User/Month | Total Searches | Required Plan | Cost |
|-------|------------------------|----------------|---------------|------|
| 10 | 5 | 50 | Free | $0 |
| 100 | 5 | 500 | Developer | $50 |
| 500 | 5 | 2,500 | Developer | $50 |
| 1,000 | 10 | 10,000 | Production | $150 |
| 2,000 | 10 | 20,000 | Production | $150 |

**Note:** SerpAPI is optional. Can be disabled to reduce costs if needed.

**Alternative:**
- Manual company research (no API cost)
- LinkedIn/Indeed scraping (not recommended - violates ToS)
- Hardcoded company database (limited usefulness)

---

#### 3.3 Stripe Payment Processing

**Current Configuration:**
- Publishable Key: `pk_test_51QNdXiGIr6GElf09...` (test mode)
- Integration: Ready but not active

**Stripe Pricing:**
- **Standard rate:** 2.9% + $0.30 per transaction
- **International cards:** +1.5% additional fee
- **Currency conversion:** +1% fee

**Monthly Revenue Processing Costs:**

| Monthly Revenue | Transactions | Stripe Fees (2.9% + $0.30) |
|----------------|--------------|---------------------------|
| $1,000 | 50 × $20 | $44.50 (4.45%) |
| $5,000 | 100 × $50 | $175.00 (3.5%) |
| $10,000 | 200 × $50 | $346.00 (3.46%) |
| $50,000 | 500 × $100 | $1,600.00 (3.2%) |

**Important:** These are deducted from revenue, not added to costs.

---

### 4. HOSTING & INFRASTRUCTURE

**Current Server:** OwnerIQ is hosted at `/mnt/c/OwnerIQ`
**Deployment Configuration:** Debian server with Nginx + PM2

#### Option A: Shared Hosting (Recommended)

**Deploy CareerTipsAI alongside OwnerIQ on the same server**

**Incremental Costs:**
- **Backend Node.js process:** Minimal CPU/RAM overhead (~200 MB RAM)
- **Frontend static files:** ~50 MB disk space
- **Nginx configuration:** No additional cost (same reverse proxy)
- **PM2 process management:** No additional cost

**Estimated Additional Cost:** $0/month (using existing server)

**Server Requirements for Both Apps:**
- CPU: 2-4 cores
- RAM: 4-8 GB (2 GB for OwnerIQ + 2 GB for CareerTipsAI + 2 GB OS)
- Disk: 50 GB
- Bandwidth: 1 TB/month

---

#### Option B: Separate VPS (If Needed)

**Providers & Pricing:**

| Provider | Plan | Specs | Monthly Cost |
|----------|------|-------|--------------|
| **DigitalOcean** | Basic Droplet | 2 vCPU, 4 GB RAM, 80 GB SSD | $24 |
| **Linode** | Shared 4GB | 2 vCPU, 4 GB RAM, 80 GB SSD | $24 |
| **Vultr** | Cloud Compute | 2 vCPU, 4 GB RAM, 80 GB SSD | $24 |
| **AWS Lightsail** | Medium | 2 vCPU, 4 GB RAM, 60 GB SSD | $40 |
| **Hetzner** | CX21 | 2 vCPU, 4 GB RAM, 40 GB SSD | €5.83 (~$6.25) |

**Recommendation:** If separate hosting needed, use **Hetzner CX21** ($6/month) for best value.

---

#### Option C: Serverless (Future Consideration)

**Vercel + Supabase Edge Functions:**
- **Vercel (Frontend):** Free for hobby, $20/month Pro
- **Supabase Edge Functions (Backend):** Included in Pro plan
- **Benefits:** Auto-scaling, zero maintenance
- **Drawbacks:** Vendor lock-in, potential cold starts

---

### 5. DOMAIN & SSL

**Current Setup:**
- Domain: TBD (not yet registered)
- SSL: Let's Encrypt (free) or Cloudflare (free)

**Costs:**
- Domain registration: $12/year (~$1/month)
- SSL certificate: $0 (Let's Encrypt free)
- DNS hosting: $0 (Cloudflare free)

**Total:** ~$1/month

---

### 6. MONITORING & OBSERVABILITY (Optional but Recommended)

#### Error Tracking

**Sentry**
- Free tier: 5,000 events/month
- Developer: $26/month (50,000 events/month)

#### Analytics

**Google Analytics**
- **Cost:** Free (sufficient for most needs)

**Plausible Analytics** (privacy-friendly alternative)
- **Cost:** $9/month (10,000 pageviews)

#### Uptime Monitoring

**UptimeRobot**
- Free tier: 50 monitors, 5-minute checks
- **Cost:** $0

**Recommendation:** Start with free tools (Google Analytics, UptimeRobot, Sentry free tier)

---

### 7. EMAIL SERVICE (Transactional Emails)

**Use Cases:**
- Password reset
- Email verification
- Application reminders
- Welcome emails

**Providers:**

| Provider | Free Tier | Paid Plan | Best For |
|----------|-----------|-----------|----------|
| **SendGrid** | 100 emails/day | $19.95/month (50K emails) | Launch |
| **Mailgun** | 5,000 emails/month (3 months) | $35/month (50K emails) | Growth |
| **AWS SES** | 62,000 emails/month (if on EC2) | $0.10 per 1,000 emails | Scale |
| **Resend** | 3,000 emails/month | $20/month (50K emails) | Modern stack |

**Estimated Usage:**

| Users | Emails per User/Month | Total Emails | Cost (SendGrid) |
|-------|---------------------|--------------|----------------|
| 100 | 10 | 1,000 | $0 (free tier) |
| 500 | 10 | 5,000 | $19.95 |
| 2,000 | 15 | 30,000 | $19.95 |

**Recommendation:** Start with **SendGrid free tier** (100/day = 3,000/month), upgrade to paid at 500+ users.

---

### 8. CDN & STATIC ASSETS (Optional)

**Current Setup:**
- Static files served from frontend (React)
- Videos: 67 MB (IMR-EN.mp4 + BRE-EN.mp4)

**Cloudflare CDN:**
- **Free tier:** Unlimited bandwidth, 100,000 requests/day
- **Cost:** $0

**Recommendation:** Use Cloudflare free tier for video delivery and static assets.

---

### 9. BACKUP & DISASTER RECOVERY

**Supabase Backups:**
- **Free tier:** No automatic backups
- **Pro tier:** Daily backups included (7-day retention)
- **Team tier:** Point-in-time recovery

**Additional Backup (Recommended):**
- **Manual database exports:** Weekly/monthly (free)
- **S3 backup storage:** $0.023 per GB/month
  - 1 GB backup = $0.023/month
  - 10 GB backup = $0.23/month

**Estimated Cost:** $0.50 - $2/month for redundant backups

---

## 📈 TOTAL MONTHLY COSTS BY PHASE

### Phase 1: Development (1-10 users)
| Service | Cost |
|---------|------|
| Supabase (Free) | $0 |
| OpenAI API | $0.10 |
| SerpAPI (Free) | $0 |
| Hosting (Shared with OwnerIQ) | $0 |
| Domain | $1 |
| Email (SendGrid Free) | $0 |
| Monitoring (Free tools) | $0 |
| **TOTAL** | **~$1/month** |

---

### Phase 2: Launch / Beta (10-100 users)
| Service | Cost |
|---------|------|
| Supabase Pro | $25 |
| OpenAI API (100 users × 10 jobs) | $1.50 |
| SerpAPI Developer | $50 |
| Hosting (Shared with OwnerIQ) | $0 |
| Domain | $1 |
| Email (SendGrid Free) | $0 |
| Monitoring (Sentry Free) | $0 |
| Backups | $0.50 |
| **TOTAL** | **~$78/month** |
| **Cost per user** | **$0.78** |

---

### Phase 3: Growth (100-500 users)
| Service | Cost |
|---------|------|
| Supabase Pro | $25 |
| OpenAI API (500 users × 15 jobs) | $11 |
| SerpAPI Developer | $50 |
| Hosting (Shared with OwnerIQ) | $0 |
| Domain | $1 |
| Email (SendGrid Essentials) | $20 |
| Monitoring (Sentry Developer) | $26 |
| Backups | $1 |
| CDN (Cloudflare Free) | $0 |
| **TOTAL** | **~$134/month** |
| **Cost per user** | **$0.27** |

---

### Phase 4: Scale (500-2,000 users)
| Service | Cost |
|---------|------|
| Supabase Pro | $25 |
| OpenAI API (1,000 users × 20 jobs) | $30 |
| SerpAPI Production | $150 |
| Hosting (Dedicated VPS - Hetzner) | $6 |
| Domain | $1 |
| Email (SendGrid Essentials) | $20 |
| Monitoring (Sentry Developer) | $26 |
| Backups (S3) | $2 |
| CDN (Cloudflare Free) | $0 |
| **TOTAL** | **~$260/month** |
| **Cost per user** | **$0.26** |

---

### Phase 5: Enterprise (2,000+ users)
| Service | Cost |
|---------|------|
| Supabase Team | $599 |
| OpenAI API (2,000 users × 25 jobs) | $75 |
| SerpAPI Production | $150 |
| Hosting (Dedicated VPS - upgraded) | $50 |
| Domain | $1 |
| Email (SendGrid Pro) | $90 |
| Monitoring (Sentry Business) | $80 |
| Backups (S3 + redundancy) | $10 |
| CDN (Cloudflare Pro) | $20 |
| **TOTAL** | **~$1,075/month** |
| **Cost per user** | **$0.54** |

---

## 💡 COST OPTIMIZATION STRATEGIES

### 1. API Cost Reduction

**OpenAI:**
- Implement response caching (save 50-70% on repeated queries)
- Rate limiting per user (e.g., 10 analyses per day)
- Batch processing for similar job descriptions
- **Potential savings:** $5-20/month at scale

**SerpAPI:**
- Cache job search results (24-hour TTL)
- Limit searches per user (e.g., 5 per day)
- Offer "manual research" as free alternative
- **Potential savings:** $50-100/month

---

### 2. Storage Optimization

**Videos:**
- Compress videos (reduce 67 MB → 30 MB with minimal quality loss)
- Use CDN for video delivery (Cloudflare free tier)
- Consider YouTube embedding (free, but less control)

**User Files:**
- Compress uploaded PDFs
- Delete old generated resumes (>90 days)
- Implement storage quotas per tier

**Potential savings:** Delay Supabase tier upgrades by 6-12 months

---

### 3. Hosting Optimization

**Current Plan (Recommended):**
- Deploy on same server as OwnerIQ (zero incremental cost)
- Monitor resource usage
- Upgrade only when needed

**Future Optimization:**
- Migrate to serverless (Vercel + Supabase Edge Functions)
- Auto-scaling for peak traffic
- Regional deployment for latency

---

### 4. Monitoring Free Tools Stack

**Recommended Free Stack:**
- **Error tracking:** Sentry Free (5,000 events/month)
- **Analytics:** Google Analytics
- **Uptime:** UptimeRobot Free
- **Logs:** Supabase Logs (Pro tier includes 7 days)

**Upgrade triggers:**
- Sentry: When hitting 5,000 events/month (indicates need for better error handling)
- Analytics: When needing user behavior funnels (Mixpanel/Amplitude)

---

## 📊 REVENUE vs COST ANALYSIS

### Break-Even Analysis

**Assumptions:**
- Average revenue per user: $29/month (Pro tier)
- Cost per user: $0.27 - $0.78 (depending on phase)

**Break-even scenarios:**

| Users | Monthly Revenue | Monthly Costs | Profit | Margin |
|-------|----------------|---------------|--------|--------|
| 10 | $290 | $1 | $289 | 99.7% |
| 50 | $1,450 | $78 | $1,372 | 94.6% |
| 100 | $2,900 | $78 | $2,822 | 97.3% |
| 500 | $14,500 | $134 | $14,366 | 99.1% |
| 1,000 | $29,000 | $260 | $28,740 | 99.1% |
| 2,000 | $58,000 | $1,075 | $56,925 | 98.1% |

**Key Insight:** CareerTipsAI has exceptional unit economics with 95-99% gross margin.

---

## 🚨 COST RISKS & MITIGATION

### Risk 1: Viral Growth Spike

**Scenario:** Sudden influx of 5,000 users in one month

**Impact:**
- SerpAPI costs spike to $750/month (30,000+ searches)
- OpenAI costs spike to $150/month
- Supabase bandwidth overages: $50-100/month
- **Total unexpected cost:** $900-1,000/month

**Mitigation:**
- Implement rate limiting (max 10 API calls per user per day)
- Cache aggressively (reduce API calls by 60-80%)
- Monitor API usage daily
- Set up billing alerts at $100, $250, $500

---

### Risk 2: API Price Increases

**Scenario:** OpenAI or SerpAPI raises prices by 50%

**Impact:**
- OpenAI: $30 → $45/month (at 1,000 users)
- SerpAPI: $150 → $225/month
- **Total impact:** +$90/month

**Mitigation:**
- Have backup API providers (Anthropic Claude, Cohere)
- Build API abstraction layer for easy switching
- Negotiate volume discounts at scale
- Consider self-hosting open-source models (Llama 3)

---

### Risk 3: Database Storage Overruns

**Scenario:** Users upload excessive files, hit storage limits

**Impact:**
- Forced upgrade to Supabase Team ($599/month vs $25/month)
- **Cost increase:** +$574/month

**Mitigation:**
- Implement file size limits (5 MB per upload)
- Storage quotas per tier (Free: 10 MB, Pro: 50 MB, Executive: 100 MB)
- Auto-delete old files (>180 days)
- Compress all uploaded PDFs

---

## 🎯 RECOMMENDED IMPLEMENTATION PLAN

### Month 1-3: Development Phase
- **Goal:** Build and test with minimal costs
- **Budget:** $1-5/month
- **Setup:**
  - Supabase Free tier
  - OpenAI API (pay-as-you-go)
  - SerpAPI Free tier
  - Deploy on existing OwnerIQ server
  - Free monitoring tools

---

### Month 4-6: Launch Phase
- **Goal:** Onboard first 100 paying users
- **Budget:** $75-125/month
- **Setup:**
  - Upgrade to Supabase Pro ($25)
  - Upgrade to SerpAPI Developer ($50)
  - Implement SendGrid free tier
  - Keep monitoring on free tools
  - **Buffer:** $50 for overages

**Expected Revenue:** $2,900/month (100 users × $29)
**Expected Profit:** $2,775+/month
**Margin:** 95.6%

---

### Month 7-12: Growth Phase
- **Goal:** Scale to 500 users
- **Budget:** $130-175/month
- **Setup:**
  - Keep Supabase Pro
  - Add Sentry Developer ($26)
  - Upgrade SendGrid Essentials ($20)
  - Monitor bandwidth/storage usage

**Expected Revenue:** $14,500/month (500 users × $29)
**Expected Profit:** $14,325+/month
**Margin:** 98.8%

---

### Year 2: Scale Phase
- **Goal:** 1,000-2,000 users
- **Budget:** $250-400/month
- **Setup:**
  - Evaluate Supabase Team upgrade
  - Upgrade SerpAPI to Production
  - Consider dedicated VPS
  - Professional monitoring tools

**Expected Revenue:** $29,000-58,000/month
**Expected Profit:** $28,600-57,600/month
**Margin:** 98-99%

---

## 📝 NEXT STEPS

1. **Immediate (This Week):**
   - [ ] Keep Supabase Free tier (current setup)
   - [ ] Monitor OpenAI API usage (currently in development)
   - [ ] Verify SerpAPI free tier limits
   - [ ] Deploy CareerTipsAI on OwnerIQ server

2. **Pre-Launch (Weeks 2-4):**
   - [ ] Set up SendGrid account
   - [ ] Configure Cloudflare CDN for videos
   - [ ] Implement API usage monitoring
   - [ ] Set up billing alerts

3. **Launch Readiness (Before First User):**
   - [ ] Upgrade to Supabase Pro ($25/month)
   - [ ] Upgrade to SerpAPI Developer ($50/month)
   - [ ] Configure backup strategy
   - [ ] Test all API integrations

4. **Post-Launch (Ongoing):**
   - [ ] Monitor costs weekly
   - [ ] Optimize API caching
   - [ ] Track cost per user metric
   - [ ] Plan for scale (500+ users)

---

## 🔗 USEFUL RESOURCES

**Pricing Pages:**
- Supabase: https://supabase.com/pricing
- OpenAI API: https://openai.com/api/pricing/
- SerpAPI: https://serpapi.com/pricing
- SendGrid: https://sendgrid.com/pricing/
- Hetzner: https://www.hetzner.com/cloud
- Stripe: https://stripe.com/pricing

**Monitoring:**
- Supabase Dashboard: https://fytyfeapxgswxkecneom.supabase.co
- OpenAI Usage: https://platform.openai.com/usage
- SerpAPI Dashboard: https://serpapi.com/dashboard

---

## 📧 CONTACT

**Questions about costs?**
- Review this document monthly
- Track actual vs. estimated costs
- Optimize based on real usage patterns
- Update projections as user base grows

---

**Document Version:** 1.0
**Next Review:** December 2025
**Owner:** Andreína Villar / Development Team
