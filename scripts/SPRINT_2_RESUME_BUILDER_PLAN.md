# 🚀 Sprint 2: Interview-Magnet Resume Builder

**Based on:** Interview-Magnet Resume System™ Workbook (CareerTipsAI 2025)
**Start Date:** November 20, 2025
**Estimated Duration:** 2 weeks
**Status:** READY TO START

---

## 📚 Methodology Overview

The Interview-Magnet Resume System™ follows a proven 3-step process:

### **Step 1: CAPTURE & POSITION**
- Gather 6-10 years of experience
- Create PAR stories (Problem → Actions → Result)
- Write 2-3 line Professional Profile
- List 6-12 Areas of Excellence (keywords)

### **Step 2: CRAFT & STRUCTURE**
- Convert PARs to bullets: **Verb + Scope + Action + Metric**
- ATS-safe formatting (clean fonts, no tables/graphics)
- Choose format: Chronological (recommended) or Functional

### **Step 3: TARGET & LAUNCH**
- Extract top 15 keywords from Job Description
- Map keywords to Profile, Skills, Accomplishments
- Run 5-point QA checklist
- Export as PDF/DOCX

---

## 🗄️ Database Schema

**8 Tables Created:**

1. **user_resumes** - Master resume with Profile + Skills
2. **par_stories** - Problem-Action-Result accomplishment stories
3. **work_experience** - Company, role, scope, dates
4. **accomplishments** - Bullet points (linked to work_experience and par_stories)
5. **education** - Degrees and institutions
6. **certifications** - Professional certifications
7. **job_description_analysis** - JD keyword extraction and mapping
8. **tailored_resumes** - JD-specific versions with modified content

**Key Features:**
- Full RLS (Row Level Security) - users only see their own data
- JSONB fields for flexible data (keywords, actions, mappings)
- Linking between PAR stories → accomplishments → work experience
- Support for both master resume and tailored versions

**SQL File:** `CREATE_RESUME_TABLES.sql`

---

## 🎯 Implementation Plan

### **Phase 1: PAR Story Builder (Week 1, Days 1-3)**

**Goal:** Allow users to capture accomplishments using Problem-Action-Result framework

#### Components to Build:

**1.1 PARStoryForm.tsx**
```
Fields:
- Role/Company (text)
- Year (dropdown: 2015-2025)
- Problem/Challenge (textarea, 200 chars)
- Actions (3 text inputs for 2-3 actions)
- Result (textarea with metric guidance)
- Metrics (tags: $, %, time, volume)
- "Would I do this again?" (checkbox)
- Competencies (multi-select: Leadership, Technical, Strategic, etc.)
```

**1.2 PARStoryList.tsx**
```
Features:
- Grid/List view of all PAR stories
- Filter by: Year, Competency, "Will do again"
- Convert to bullet button
- Edit/Delete actions
```

**1.3 AI Prompt for PAR → Bullet Conversion**
```
System Prompt:
"Convert this PAR story into a resume bullet using the formula:
Verb + Scope + Action + Metric.

PAR Story:
- Problem: {problem}
- Actions: {actions}
- Result: {result}

Guidelines:
- Start with strong action verb (Led, Increased, Reduced, Built, etc.)
- Lead with numbers when possible
- Keep under 150 characters
- Past tense only
- No weak openers like 'Responsible for' or 'Helped'

Generate 3 variations with different emphasis."
```

#### Database Operations:
```typescript
// Save PAR story
POST /api/resume/par-stories
Body: { role_company, year, problem_challenge, actions, result, metrics, will_do_again, competencies }

// Get all PAR stories
GET /api/resume/par-stories/:userId

// Convert PAR to bullet (with AI)
POST /api/resume/par-stories/:id/convert-to-bullet
Response: { bullet_variations: string[], recommended: string }
```

---

### **Phase 2: Resume Profile Builder (Week 1, Days 4-5)**

**Goal:** Help users write their Professional Profile + Areas of Excellence

#### Components to Build:

**2.1 ProfileBuilder.tsx**
```
Structure (following workbook page 8):

Section 1: Who You Are (Sentence 1)
- Input: "I am a [title] with [experience level] in [industry]"
- Example: "Service Business Leader with local and international experience in consulting firms"

Section 2: Core Skills (Sentence 2)
- Multi-select skills that define you
- "Expert at: [skill 1], [skill 2], [skill 3]"

Section 3: Soft Skills (3-4 sentences)
- Template: "Skilled at [soft skill list aligned with target JD]"
- AI suggestion based on PAR stories

Section 4: Areas of Excellence
- 6-12 keyword tags (ATS optimization)
- AI extraction from work history + PAR stories
- Editable chips

Preview:
- Live formatted preview matching workbook examples
- Character count (target: 150-250 words)
- ATS score indicator
```

**2.2 AI Prompts:**

```javascript
// Extract skills from PAR stories
Prompt: "Analyze these PAR stories and extract:
1. Top 10 hard skills (technical, tools, methodologies)
2. Top 10 soft skills (leadership, communication, problem-solving)
3. Suggested 'Areas of Excellence' keywords for ATS

PAR Stories:
{json_array_of_pars}

Return as JSON with categories."

// Generate Profile variations
Prompt: "Write 3 variations of a Professional Profile using this structure:
- Sentence 1: {title} with {experience} in {industry}
- Sentence 2: Expert at {core_skills}
- Sentences 3-4: Soft skills: {soft_skills}
- Areas of Excellence: {keywords}

Keep each variation 150-250 words, ATS-friendly, impactful."
```

---

### **Phase 3: Work Experience Builder (Week 1, Days 6-7)**

**Goal:** Structured work history with scope and accomplishments

#### Components to Build:

**3.1 WorkExperienceForm.tsx**
```
Company Section:
- Company name
- Short description with measurables
  Example: "Global tech company, $50B revenue, 125 countries"
- Location (city, country)

Role Section:
- Job title
- Start date (YYYY or MM/YYYY)
- End date (or "Current")
- Purpose & Scope textarea
  Guidance: "Include budget/headcount/geographies/vendors"
  Example: "Led team of 36, $12M budget across LATAM"

- Tools/Systems (multi-select tags)

Accomplishments Section:
- Link existing PAR-converted bullets
- Or add new bullets manually
- Drag-to-reorder (4-7 bullets recommended)
- "Featured" toggle for functional resume
```

**3.2 WorkExperienceList.tsx**
```
- Timeline view (chronological)
- Expand/collapse cards
- Edit/Delete/Duplicate
- "Add accomplishment" quick action
```

---

### **Phase 4: Resume Assembly & Preview (Week 2, Days 1-2)**

**Goal:** Show complete resume with live preview

#### Components to Build:

**4.1 ResumePreview.tsx**
```
Layout Options:
- Chronological (default)
  Header → Profile → Skills → Experience → Education → Certs

- Functional (for career changers)
  Header → Profile → Skills/Themes → Accomplishments → Work History → Education

ATS Rules Display:
✓ Standard fonts (Calibri 10-12pt)
✓ 0.5-1" margins
✓ One page (<10 yrs) / Two pages (10+ yrs)
✓ Consistent dates (YYYY format)
✓ No tables/graphics/text boxes
✓ 4-7 bullets per role

Real-time validation:
- Red/Yellow/Green indicators
- "Fix this" suggestions
```

**4.2 ResumeExport.tsx**
```
Export Options:
1. PDF (ATS-friendly, single-column)
2. DOCX (editable)
3. Plain text (for paste into forms)

File naming:
FirstLast_Resume_YYYY.pdf
FirstLast_Resume_CompanyName_YYYY.pdf (tailored)

Storage:
- Supabase Storage bucket: "resumes"
- Track version history
```

---

### **Phase 5: Job Description Analyzer & Keyword Mapper (Week 2, Days 3-5)**

**Goal:** Step 3 of Interview-Magnet method - TARGET & LAUNCH

#### Components to Build:

**5.1 JDAnalyzer.tsx**
```
Input:
- Job title
- Company name
- Full JD text (paste or URL scrape)

AI Analysis Output:
1. Top 15 keywords extracted
   Format: { keyword, count, category: "hard_skill" | "soft_skill" | "tool" }

2. Keyword mapping table (workbook page 14):
   | Keyword | Where It Goes | Matching Evidence | Status |
   |---------|---------------|-------------------|--------|
   | Python  | Skills        | Built 5 apps      | ✓      |
   | Agile   | Profile       | Led scrum team    | Tweak  |

3. Gap analysis:
   - Keywords in JD but NOT in resume (red)
   - Keywords in resume but NOT in JD (yellow)
   - Matched keywords (green)
```

**5.2 AI Prompts:**

```javascript
// Extract keywords
Prompt: "Analyze this job description and extract:
1. Top 15 ATS keywords (ranked by importance)
2. Required hard skills
3. Required soft skills
4. Tools/technologies mentioned
5. Certifications required

Job Description:
{jd_text}

Return as JSON with priority scores."

// Suggest resume modifications
Prompt: "Compare this resume with the job description.
Suggest specific changes to:
1. Profile (rewrite to include top 3 JD keywords)
2. Skills section (add missing keywords truthfully)
3. Accomplishments (rewrite 3-5 bullets to match JD language)

Resume:
{resume_json}

Job Description:
{jd_text}

Keep all facts truthful. Only suggest if evidence exists."
```

**5.3 TailoredResumeGenerator.tsx**
```
Flow:
1. Select master resume
2. Select JD analysis
3. AI suggests changes (show diff view)
4. User approves/edits changes
5. Generate tailored resume
6. Run QA checklist (workbook page 15):
   [ ] Profile includes 2-3 JD keywords
   [ ] Skills mirror JD language
   [ ] 3-5 bullets echo JD priorities
   [ ] No contradictions
   [ ] Filename updated
7. Export + Save to database
```

---

### **Phase 6: AI Integration (Throughout Sprint)**

**OpenAI Integration Points:**

1. **PAR to Bullet Conversion** (GPT-4o-mini)
   - Fast, cheap, good for variations

2. **Profile Generation** (GPT-4o)
   - More creative, better writing quality

3. **Keyword Extraction** (GPT-4o-mini)
   - Structured output, JSON mode

4. **Resume Tailoring** (GPT-4o)
   - Complex reasoning, multi-step

**API Setup:**
```typescript
// frontend/src/utils/openai.ts
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // For dev only, move to backend for prod
})

export const convertPARToBullet = async (par: PARStory) => {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: 'You are a resume expert. Convert PAR stories to ATS-optimized bullets using: Verb + Scope + Action + Metric.'
      },
      {
        role: 'user',
        content: `Problem: ${par.problem}\nActions: ${par.actions.join(', ')}\nResult: ${par.result}`
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  })

  return response.choices[0].message.content
}
```

---

## 🎨 UI/UX Design

### Navigation Structure:
```
Dashboard
└── Resume Builder
    ├── 1. PAR Stories (Capture & Position)
    │   ├── Add New Story
    │   └── My Stories (list)
    │
    ├── 2. Build Profile (Capture & Position)
    │   ├── Professional Summary
    │   └── Areas of Excellence
    │
    ├── 3. Work Experience (Craft & Structure)
    │   ├── Add Experience
    │   └── Link Accomplishments
    │
    ├── 4. Education & Certs
    │
    ├── 5. Preview & Export
    │   ├── Master Resume
    │   └── Tailored Versions
    │
    └── 6. Job Matcher (Target & Launch)
        ├── Analyze JD
        ├── Keyword Mapping
        └── Generate Tailored Resume
```

### Progress Indicator:
```
Step 1: Capture (PAR Stories + Profile)  →  Step 2: Craft (Experience + Bullets)  →  Step 3: Target (JD Match + Export)
  ●                                            ○                                         ○
```

---

## 📊 Success Metrics

**Week 1 Goals:**
- [ ] User can create 3+ PAR stories
- [ ] AI converts PAR to 3 bullet variations
- [ ] User can generate Professional Profile
- [ ] User can add 1+ work experience entry

**Week 2 Goals:**
- [ ] User can preview complete resume
- [ ] User can export PDF/DOCX (ATS-compliant)
- [ ] User can analyze 1 job description
- [ ] User can generate 1 tailored resume
- [ ] Keyword match score: 70%+ for tailored resumes

---

## 🔧 Technical Stack

**New Dependencies:**
```bash
# AI
npm install openai@4.x

# PDF Generation
npm install jspdf jspdf-autotable
npm install @react-pdf/renderer

# DOCX Generation
npm install docx

# Rich Text Editor (for Profile)
npm install react-quill

# Drag and Drop (for bullet reordering)
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## 📝 Translations Needed

Add to `en.json` and `es.json`:
```json
{
  "resumeBuilder": {
    "steps": {
      "capture": "Capture & Position",
      "craft": "Craft & Structure",
      "target": "Target & Launch"
    },
    "par": {
      "title": "PAR Story Builder",
      "subtitle": "Problem → Actions → Result",
      "problem": "What was the challenge?",
      "actions": "What did you do? (2-3 key actions)",
      "result": "What was the measurable outcome?",
      "willDoAgain": "Would I gladly do this again?",
      "convert": "Convert to Bullet"
    },
    "profile": {
      "title": "Professional Profile",
      "whoYouAre": "Who you are (title + experience)",
      "coreSkills": "Core skills that define you",
      "softSkills": "Soft skills aligned with target role",
      "areasOfExcellence": "Areas of Excellence (6-12 keywords)"
    },
    "workExperience": {
      "title": "Work Experience",
      "company": "Company Name",
      "companyDesc": "Short description with measurables",
      "jobTitle": "Job Title",
      "scope": "Purpose & Scope (budget/headcount/geographies)",
      "accomplishments": "Key Accomplishments (4-7 bullets)"
    },
    "export": {
      "atsCompliant": "ATS-Compliant Export",
      "pdf": "Download PDF",
      "docx": "Download DOCX",
      "plainText": "Copy Plain Text"
    },
    "jdAnalyzer": {
      "title": "Job Description Analyzer",
      "paste": "Paste the full job description",
      "analyze": "Analyze & Extract Keywords",
      "topKeywords": "Top 15 Keywords",
      "keywordMapping": "Keyword Mapping",
      "generateTailored": "Generate Tailored Resume"
    }
  }
}
```

---

## 🚦 Quality Checklist (Before Launch)

**ATS Compliance:**
- [ ] Standard fonts only (Calibri, Arial, Times)
- [ ] No tables, text boxes, columns, graphics
- [ ] Consistent date format (YYYY or MM/YYYY)
- [ ] Clear section headers
- [ ] 0.5-1" margins
- [ ] One page (<10 yrs) or two pages (10+ yrs)

**Content Quality:**
- [ ] All bullets start with strong verbs
- [ ] All bullets include metrics
- [ ] Profile includes 2-3 JD keywords (tailored version)
- [ ] Skills section mirrors JD language
- [ ] No typos or grammatical errors

**User Experience:**
- [ ] Save draft every 30 seconds
- [ ] "Unsaved changes" warning
- [ ] Mobile responsive
- [ ] Loading states for AI operations
- [ ] Error handling with retry

---

## 🎯 Next Steps (After Sprint 2)

**Sprint 3 Enhancements:**
1. Resume upload & parsing (import existing resume)
2. A/B testing (compare 2 resume versions)
3. ATS score calculator (keyword density, format compliance)
4. Interview question generator (based on resume bullets)
5. Cover letter generator (using resume + JD)
6. LinkedIn profile optimizer (convert resume to profile)

---

## 📚 Reference Documents

1. **Interview-Magnet Resume System™ Workbook** (PDF, 19.5MB)
   - Location: `/mnt/c/CarrersA/documents/Interview-Magnet Resume System™ workbook.pdf`
   - Pages 2-15: Complete methodology

2. **CREATE_RESUME_TABLES.sql**
   - Full database schema with RLS policies

3. **ONBOARDING_COMPLETO.md**
   - Sprint 1 learnings and patterns

---

**Ready to build?** ✅
**Database schema:** ✅
**Workbook analyzed:** ✅
**Implementation plan:** ✅

**Let's start with Phase 1: PAR Story Builder! 🚀**
