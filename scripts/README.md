# CareerTipsAI - AI-Powered Career Reinvention Platform

**Version:** 1.0
**Status:** Phase 0 - Foundation & Planning Complete
**Target MVP Launch:** 14 weeks from development start
**Full Launch:** 32 weeks from development start

---

## 📖 Overview

**CareerTipsAI (CTAI)** is a multilingual hybrid career reinvention ecosystem that combines AI-powered tools, proprietary methodologies, and on-demand human coaching to help professionals navigate career disruption and accelerate their job search.

**Tagline:** "Human experience + Intelligent tools + Your reinvention, accelerated"

### The Problem We Solve

- **300M+ jobs** will be disrupted by AI and automation by 2030 (McKinsey)
- **150M+ students** graduate annually; 40%+ are underemployed
- **75% of resumes** never reach human recruiters due to ATS filters
- Average job search takes **5-9 months** (we reduce this to weeks)
- Traditional career coaching is **expensive ($150-500/session)** and unscalable
- AI tools generate **generic resumes** that fail ATS and don't stand out

### Our Solution

A complete career transformation platform that includes:

1. **Interview-Magnet Resume System™** - Proprietary 3-step methodology (PAR Formula) for ATS-optimized, metric-led resumes
2. **Autonomous Job Search Agent** - Progressive automation (manual → semi-autonomous → fully autonomous)
3. **AI Interview Prep** - Company research, STAR builder, mock interviews
4. **Weekly Reinvention Cycle™** - Structured Monday (planning) / Friday (reflection) engagement rituals
5. **Adaptive Learning** - Skills gap analysis + personalized learning paths
6. **Emotional Reinvention** - Journaling, sentiment tracking, burnout detection, reframing exercises
7. **Multilingual Support** - EN/ES/PT/FR at launch (expanding to 10 languages)

---

## 🎯 Market Opportunity

- **TAM:** $400B (global career reinvention + training + AI-enabled employment + e-learning)
- **SAM:** $40B (multilingual, AI-driven career tools)
- **SOM (Year 5):** $4.2M MRR ($50M ARR)
- **Target Users:** 300M disrupted workers + 150M underemployed graduates
- **Geographic Focus:** Americas, Europe, Latin America, Africa (multilingual strategy)

### Revenue Model

| Revenue Stream | % of Year 5 Revenue | Pricing Model |
|---------------|---------------------|---------------|
| B2C Memberships | 36% | $19-$149/mo |
| Corporate Licenses | 30% | $25-$32/seat/mo |
| Institutional Packages | 15% | $25K-$150K/year |
| Reinvention Toolkit™ | 11% | $99 one-time or $15/mo |
| Premium Coaching | 8% | $300/session |
| Courses/Mobile App | 7% | Add-ons |

**B2C Pricing:**
- **Essentials:** $19/mo (1 resume, 5 applications/month, basic AI coaching)
- **Pro:** $49/mo (unlimited resumes/applications, advanced AI, mock interviews, learning paths)
- **Executive:** $149/mo (all Pro + executive templates, LinkedIn optimization, salary negotiation, on-demand human coaching)

---

## 🏗️ Project Structure

```
/home/efraiprada/carreerstips/
├── frontend/                 # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Page components (onboarding, resume, jobs, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility functions
│   │   ├── styles/           # Global styles
│   │   └── App.tsx           # Main app component
│   ├── public/               # Static assets
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Supabase Edge Functions (Deno)
│   ├── functions/
│   │   ├── onboarding-clarity-snapshot/  # Career clarity AI
│   │   ├── resume-upload/                 # Resume parsing
│   │   ├── resume-generate-bullet/        # PAR → bullet AI
│   │   ├── resume-generate/               # PDF/DOCX generation
│   │   ├── resume-tailor/                 # Job-specific tailoring
│   │   ├── jobs-scraper/                  # Daily job aggregation (cron)
│   │   ├── jobs-recommendations/          # Job matching algorithm
│   │   ├── interview-company-research/    # Company research AI
│   │   ├── interview-validate-star/       # STAR answer validation
│   │   ├── journal-entry/                 # Sentiment analysis
│   │   ├── stripe-webhook/                # Payment events
│   │   └── analytics-aggregation/         # Weekly summaries (cron)
│   └── supabase/
│       └── migrations/       # Database migration scripts
├── docs/                     # Documentation
│   ├── requirements-v3-FINAL.md  # ✅ Complete requirements (50K words)
│   ├── source-requirements-questions.md
│   ├── source-presentation.md
│   └── api-specifications.md     # (TODO)
├── ai-pipeline/              # AI integration layer (future)
│   ├── prompts/              # AI prompt library
│   ├── providers/            # OpenAI, Anthropic, Open-source
│   └── cost-tracking/        # Monitor AI spend
├── shared/                   # Shared types and constants
│   ├── types/                # TypeScript types
│   └── constants/            # Enums, constants
├── assets/
│   ├── brand/                # Logo, images, branding
│   │   ├── logo.png
│   │   ├── Landing_page.html
│   │   └── *.png
│   └── content/              # Marketing content
├── schema.sql                # ✅ Complete database schema
├── .gitignore                # ✅ Git ignore rules
├── extract_docs.py           # ✅ Document extraction script
├── create_word_doc.py        # HTML → Word documentation generator
├── package.json              # Root package.json (if needed)
└── README.md                 # ✅ This file
```

---

## 🚀 Tech Stack

### Frontend
- **React 18.2** - Component-based UI library
- **Vite 4.x** - Fast build tool and dev server
- **TypeScript 5.x** - Type safety
- **Tailwind CSS 3.x** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **React Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Recharts** - Data visualization
- **react-i18next** - Internationalization (EN/ES/PT/FR)

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL 15 (database)
  - Edge Functions (Deno serverless)
  - Authentication (JWT + OAuth)
  - Storage (S3-compatible)
  - Row-Level Security (RLS)
- **Deno Runtime** - Edge Functions runtime

### AI & Machine Learning
- **OpenAI GPT-4o** - High-quality resume generation, coaching, interview prep
- **OpenAI GPT-4o-mini** - Cost-effective classification, validation, sentiment analysis
- **Anthropic Claude 3.5 Sonnet** - Fallback provider
- **OpenAI Embeddings** - Job matching (semantic similarity)
- **Future:** Llama 3, Mixtral (on-premise corporate deployments)

### Integrations
- **Stripe** - Subscription billing
- **SendGrid** - Transactional emails
- **Sentry** - Error monitoring
- **Mixpanel/Amplitude** - Product analytics
- **LinkedIn Jobs API** - Job aggregation
- **Indeed API** - Job aggregation
- **ZipRecruiter API** - Job aggregation

### Hosting & Infrastructure
- **Vercel** - Frontend hosting (global CDN, auto HTTPS)
- **Supabase Cloud** - Managed PostgreSQL + Edge Functions
- **Supabase Storage** - File storage (resumes, certificates)

---

## 📊 Database Schema

Complete PostgreSQL schema with 25+ tables:

**Core Tables:**
- `users` - User accounts and authentication
- `user_profiles` - Career context (target jobs, locations, salary range)
- `resume_versions` - Multiple resumes per user
- `roles` - Work experience
- `par_accomplishments` - Interview-Magnet PAR stories
- `competencies` - Skills and keywords
- `education` - Academic degrees
- `certifications` - Professional credentials
- `jobs` - Aggregated jobs from job boards
- `job_applications` - User applications (manual + AI-applied)
- `interviews` - Scheduled interviews
- `interview_questions` - STAR answer library
- `mock_interviews` - Practice sessions
- `learning_paths` - Skill development plans
- `weekly_goals` - Monday ritual goals
- `daily_tasks` - Daily micro-tasks
- `journal_entries` - Reflection + sentiment analysis
- `activity_logs` - Audit trail
- `ai_cost_tracking` - Operational monitoring
- `subscriptions` - Stripe subscriptions

**See full schema:** `schema.sql` (800+ lines with indexes, RLS policies, triggers)

---

## 🗓️ Development Roadmap

### Phase 0: Foundation (Weeks 1-2) ✅ COMPLETE
- [x] Requirements document finalized (50K words)
- [x] Database schema designed
- [x] Project structure created
- [x] Git repository initialized
- [ ] Supabase project created
- [ ] Vercel project created
- [ ] Design system defined

### Phase 1: Core Tools - MVP (Weeks 3-14)

**Sprint 1: Authentication & Onboarding (Weeks 3-4)**
- Sign-up/sign-in (email/password, Google OAuth, LinkedIn OAuth)
- 60-second onboarding flow (5 questions)
- Career Clarity Snapshot generation (AI model: GPT-4o-mini)
- Dashboard skeleton

**Sprint 2: Resume Upload & Parsing (Weeks 5-6)**
- Resume upload (PDF/DOCX)
- AI parsing (extract roles, dates, bullets)
- Manual editing interface

**Sprint 3: PAR Accomplishment Builder (Weeks 7-8)**
- PAR exercise form (Problem, Actions, Result, Passion Score, Competencies)
- AI bullet generation (GPT-4o): Verb + Scope + Action + Metric
- Bullet refinement ("Refine for impact")

**Sprint 4: Resume Generation & Download (Weeks 9-10)**
- 3 ATS-safe templates (Classic, Modern, Executive)
- PDF/DOCX generation (server-side or client-side)
- ATS compatibility testing (Jobscan.co scoring >90%)

**Sprint 5: Job-Targeted Resume Tailoring (Week 11)**
- Job description parser (GPT-4o)
- Match score calculator (cosine similarity with embeddings)
- Tailored resume generation

**Sprint 6: MVP Polish & Launch Prep (Weeks 12-14)**
- Landing page + pricing page
- Stripe integration
- Email notifications (SendGrid)
- Sentry error monitoring
- Beta testing (20 users)
- Bug fixes

🎯 **MVP LAUNCH: Week 14**

### Phase 2: Ecosystem Expansion (Weeks 15-22)

**Sprint 7-10:**
- Job search & recommendations (scraping + AI matching)
- Semi-autonomous application prep (AI prepares, user approves)
- Interview prep (company research, STAR builder, mock interviews)
- Weekly Reinvention Cycle (Monday/Friday rituals, progress dashboard)

🎯 **V2 LAUNCH: Week 22**

### Phase 3: Autonomous Agent & Scale (Weeks 23-32)

**Sprint 11-15:**
- Full autonomy mode (AI applies to jobs automatically with standing consent)
- Learning paths (skills gap analysis, curated courses)
- Emotional reinvention (journaling, sentiment tracking, reframing)
- Multilingual expansion (ES, PT, FR translations)
- Marketing & launch prep

🎯 **FULL LAUNCH: Week 32**

---

## 🎨 Design System

**Brand Colors:**
- Primary: `#007bff` (Blue)
- Text: `#212529` (Dark Gray)
- Accent: `#6c757d` (Medium Gray)
- Background: `#f8f9fa` (Light Gray)
- Success: `#28a745` (Green)
- Warning: `#ffc107` (Yellow)
- Error: `#dc3545` (Red)

**Typography:**
- Headings: **Manrope** (sans-serif, bold)
- Body: **Nunito Sans** (sans-serif, regular)
- Code: **Courier New** (monospace)

**Resume Templates:**
1. **Classic:** Traditional serif font (Times New Roman), left-aligned, conservative
2. **Modern:** Sans-serif (Arial), clean lines, subtle blue accents
3. **Executive:** Bold header, executive summary section, professional

---

## 📄 Key Documentation

- **`docs/requirements-v3-FINAL.md`** - ✅ Complete requirements document (50,000 words)
  - Executive summary
  - Product vision & market positioning
  - Market opportunity ($400B TAM)
  - Business model (6 revenue streams)
  - CTAI Master Framework™ 2.0 (6 pillars)
  - Interview-Magnet Resume System™ methodology
  - Product architecture & features (7 modules)
  - Technology stack (complete specifications)
  - Development roadmap (24-32 weeks, sprint-by-sprint)
  - Success metrics & KPIs (AARRR pirate metrics)
  - Competitive analysis (vs. Teal, Kickresume, LinkedIn Premium, BetterUp)
  - Risk analysis & mitigation (12 risks documented)
  - Legal & IP strategy (trademarks, patents, contracts)
  - AI Prompts Library (14 prompts with examples)

- **`schema.sql`** - ✅ Complete database schema (800+ lines)
  - 25+ tables with relationships
  - Indexes for performance
  - Row-Level Security (RLS) policies
  - Triggers for auto-update
  - Comments and documentation

- **`docs/source-requirements-questions.md`** - Original requirements gathering questions
- **`docs/source-presentation.md`** - Original PowerPoint presentation (7 slides)

---

## 🔧 Getting Started

### Prerequisites

- **Node.js 18+** (for frontend)
- **Deno 1.x** (for Supabase Edge Functions)
- **Supabase CLI** (for local development)
- **Git**
- **pnpm** (recommended package manager)

### Setup Instructions

#### 1. Clone Repository
```bash
cd /home/efraiprada/carreerstips
git init
git add .
git commit -m "Initial commit: Phase 0 complete (requirements + schema)"
```

#### 2. Create Supabase Project
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your Supabase project (or create new)
supabase link --project-ref your-project-ref

# Run database migrations
supabase db push
```

#### 3. Set Up Environment Variables

**Frontend (.env.local):**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Backend (Supabase Edge Functions):**
```bash
# Set secrets via Supabase CLI
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set SENDGRID_API_KEY=SG...
```

#### 4. Install Dependencies

**Frontend:**
```bash
cd frontend
pnpm install
```

#### 5. Run Locally

**Frontend:**
```bash
cd frontend
pnpm dev
# Open http://localhost:5173
```

**Backend (Supabase Local Development):**
```bash
supabase start
supabase functions serve
```

---

## 📈 Success Metrics

### North Star Metric
**Number of users who land an interview within 30 days of sign-up**
**Target:** 40% (industry benchmark: 15-20%)

### Key Metrics (Month 6 Targets)

| Metric | Target |
|--------|--------|
| Total Users | 4,000 |
| Paid Users | 400 |
| MRR | $30,000 |
| Onboarding Completion Rate | 85% |
| Time to First Value | <8 minutes |
| Day 7 Retention | 40% |
| Free-to-Paid Conversion | 10% |
| NPS | 60 |
| ATS Resume Score | 90%+ |
| AI Cost per User | <$5/month |

---

## 🤝 Contributing

This is a founder-led project. External contributions are not accepted at this time.

**Team:**
- **Founder:** Andreína Villar (25+ years international executive career coaching)
- **Developer:** TBD (hiring)
- **Designer:** TBD (part-time)
- **Content Writer:** TBD (part-time)

---

## 📜 License & Legal

### Intellectual Property

**Trademarks (Priority Filings):**
- CareerTipsAI™
- Interview-Magnet Resume System™
- CTAI Master Framework™
- Weekly Reinvention Cycle™
- Reinvention Toolkit™

**Trade Secrets:**
- AI Prompt Library (exact prompts for resume generation, coaching, interview prep)
- Scoring Algorithms (job match scores, application prioritization)
- Proprietary user data insights

### Legal Documents (Required for Launch)
- Terms of Service (ToS)
- Privacy Policy (GDPR/CCPA compliant)
- Data Processing Agreements (DPAs with Supabase, OpenAI, Stripe, SendGrid)

---

## 💰 Investment & Funding

**Current Stage:** Pre-Seed (Phase 0 complete, ready for development)

**Ask:** $100K-250K (12-month runway)

**Use of Funds:**
- Developer salary: $70K (full-time)
- Designer + writer: $20K (part-time)
- Infrastructure (Supabase, Vercel, AI): $30K
- Marketing (ProductHunt, Google Ads, content): $20K
- Legal (trademarks, incorporation): $10K

**Projected ROI:**
- Year 1: 50K users, $300K MRR, break-even
- Year 3: 250K users, $2M MRR, $1.5M profit
- Year 5: 500K users, $4.2M MRR, $3.5M profit (exit opportunity)

---

## 📞 Contact

**Founder:** Andreína Villar
**Email:** [TBD]
**LinkedIn:** [TBD]
**Website:** careertipsai.com (pending launch)

---

## 🌟 Vision

**By 2030, we will have helped 500,000 professionals reinvent their careers, land dream jobs, and increase their salaries by an average of 20%.**

**Let's change lives. Let's build CareerTipsAI.** 🚀

---

**README.md v1.0 - Created November 18, 2025**
# carreerstipsai
# carreerstipsai
