# Career Vision Feature - Implementation Plan

## Overview

**PRIORITY: Optional First Feature** - Career Vision is offered as the FIRST step after user sign-up, but is completely optional. Users can choose to complete it or skip entirely.

The Career Vision module helps users discover their ideal career path by analyzing the intersection of three key elements:
- **Skills & Knowledge** - What they're good at
- **Values** - What matters to them
- **Interests** - What engages them

When these three align, users find their Career Vision (Ideal Job).

### Why First?
Users who complete Career Vision BEFORE job searching get:
- Clarity on what they truly want in their career
- Better job match scores (AI uses their preferences)
- More targeted resume content
- Higher confidence in applications

### Why Optional?
Some users already know their career direction and want to jump directly into job search, resume building, or other features. The platform should not force Career Vision on users who don't need it.

## Feature Components

### 1. Career Vision Framework (Venn Diagram)
Interactive visualization showing how Skills, Values, and Interests intersect to form the user's ideal career path.

### 2. Satisfiers & Dissatisfiers Analysis
Users reflect on their last 4 jobs, documenting:
- **Company**: What they liked/disliked and why
- **Position**: What they liked/disliked and why
- **Manager**: What they liked/disliked and why

Purpose: Identify patterns of what truly satisfies vs. dissatisfies them.

### 3. Ideal Work Preferences Questionnaire
Structured assessment across 11 categories with priority weighting:
- Industry
- Geographic location
- Compensation Package
- Benefits
- Company Profile
- Position/goals
- Basis of promotion
- Company culture
- Lifestyle/workstyle
- Type of boss
- Other considerations

**Weighting System:**
- **M** = Must have (non-negotiable)
- **10** = Highest priority
- **1** = Lowest priority

## UX Flow: Welcome Page Design

### Career Vision Welcome Page (`/career-vision/welcome`)

**Purpose:** Present Career Vision as an optional first step without pressure.

**Visual Layout:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│            🎯 Discover Your Career Vision           │
│                                                     │
│   "Find the intersection of what you're good at,   │
│    what you value, and what genuinely excites you" │
│                                                     │
│              [Venn Diagram Visual]                  │
│          Skills ∩ Values ∩ Interests = ❤️          │
│                                                     │
│   ✓ Get personalized job recommendations           │
│   ✓ Build targeted resumes faster                  │
│   ✓ Focus on opportunities that truly fit you      │
│                                                     │
│   ⏱️ Takes 10-15 minutes                            │
│   📝 Save progress and come back anytime            │
│                                                     │
│        [Start Career Vision] (Primary CTA)          │
│                                                     │
│              Skip for now →                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Behavior:**
- **Start Career Vision**: Redirects to `/career-vision/dashboard` (progress tracker)
- **Skip for now**: Sets flag `career_vision_skipped = true`, redirects to existing onboarding
- User can ALWAYS return from Dashboard widget or navigation menu

**Database Flag:**
```sql
-- Add to user_profiles table:
career_vision_started BOOLEAN DEFAULT FALSE,
career_vision_completed BOOLEAN DEFAULT FALSE,
career_vision_skipped BOOLEAN DEFAULT FALSE,
has_seen_career_vision_prompt BOOLEAN DEFAULT FALSE
```

## Database Schema

### career_vision_profiles
Stores user's identified skills, values, interests, and synthesized career vision.

```sql
CREATE TABLE career_vision_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  skills_knowledge TEXT[],
  core_values TEXT[],
  interests TEXT[],
  career_vision_statement TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### job_history_analysis
Stores analysis of past jobs (satisfiers/dissatisfiers).

```sql
CREATE TABLE job_history_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title VARCHAR(255),
  company_name VARCHAR(255),
  duration VARCHAR(100),
  -- Company
  company_liked TEXT,
  company_liked_why TEXT,
  company_disliked TEXT,
  company_disliked_why TEXT,
  -- Position
  position_liked TEXT,
  position_liked_why TEXT,
  position_disliked TEXT,
  position_disliked_why TEXT,
  -- Manager
  manager_liked TEXT,
  manager_liked_why TEXT,
  manager_disliked TEXT,
  manager_disliked_why TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### ideal_work_preferences
Stores user's work preferences with priority weights.

```sql
CREATE TABLE ideal_work_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  -- 11 preference categories, each with:
  -- {category}_preference TEXT
  -- {category}_weight VARCHAR(10)
  industry_preference TEXT,
  industry_weight VARCHAR(10),
  geographic_preference TEXT,
  geographic_weight VARCHAR(10),
  compensation_preference TEXT,
  compensation_weight VARCHAR(10),
  benefits_preference TEXT,
  benefits_weight VARCHAR(10),
  company_profile_preference TEXT,
  company_profile_weight VARCHAR(10),
  position_goals_preference TEXT,
  position_goals_weight VARCHAR(10),
  promotion_basis_preference TEXT,
  promotion_basis_weight VARCHAR(10),
  company_culture_preference TEXT,
  company_culture_weight VARCHAR(10),
  lifestyle_preference TEXT,
  lifestyle_weight VARCHAR(10),
  boss_type_preference TEXT,
  boss_type_weight VARCHAR(10),
  other_preference TEXT,
  other_weight VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Backend API Endpoints

**File: `/backend/routes/career-vision.js`**

### Career Vision Profile
```
GET    /api/career-vision/profile       - Get user's career vision profile
POST   /api/career-vision/profile       - Create/update career vision profile
```

### Job History Analysis
```
GET    /api/career-vision/job-history       - Get all job history entries
POST   /api/career-vision/job-history       - Create job history entry
PUT    /api/career-vision/job-history/:id   - Update job history entry
DELETE /api/career-vision/job-history/:id   - Delete job history entry
```

### Ideal Work Preferences
```
GET    /api/career-vision/preferences   - Get user's work preferences
POST   /api/career-vision/preferences   - Create/update work preferences
```

### AI Analysis
```
POST   /api/career-vision/analyze       - AI-powered analysis of all data
                                           Returns insights and recommendations
```

## Frontend Structure

### New Pages

**1. `/frontend/src/pages/CareerVision/Dashboard.tsx`**
- Overview of Career Vision journey
- Completion status of each section
- Visual Venn diagram showing Skills, Values, Interests intersection

**2. `/frontend/src/pages/CareerVision/SkillsValues.tsx`**
- Interactive form for Skills & Knowledge
- Interactive form for Core Values
- Interactive form for Interests
- Live Venn diagram preview

**3. `/frontend/src/pages/CareerVision/JobHistory.tsx`**
- Form to add/edit past jobs (up to 4)
- Table view of all entries
- AI-powered pattern recognition

**4. `/frontend/src/pages/CareerVision/WorkPreferences.tsx`**
- Structured questionnaire (11 categories)
- Weight selector for each (M, 10-1)
- Priority summary visualization

**5. `/frontend/src/pages/CareerVision/Summary.tsx`**
- Complete Career Vision statement
- AI-generated insights
- Recommended jobs based on preferences
- Integration with Fast-Track job search

### New Components

```
/frontend/src/components/career-vision/
├── VennDiagram.tsx           - Visual representation of intersection
├── JobHistoryCard.tsx        - Display single job analysis
├── PreferenceInput.tsx       - Preference field + weight selector
├── CareerVisionProgress.tsx  - Progress tracker component
└── InsightsPanel.tsx         - AI-generated insights display
```

## Integration with Existing Features

### 1. User Journey Flow (NEW)

**UPDATED FLOW:**
```
Sign Up → Career Vision (Optional) → Standard Onboarding → Dashboard
```

**Career Vision Entry Point:**
- Immediately after user creates account
- Full-screen welcome: "Discover Your Career Vision" with explanation
- Two prominent options:
  - **"Start Career Vision"** (primary button)
  - **"Skip for now"** (secondary button/link)
- If skipped, user goes directly to existing onboarding flow
- If started, user completes Career Vision steps, then proceeds to dashboard

**Return Access:**
- Dashboard widget shows completion status
- "Complete Your Career Vision" prompt if skipped
- "Review Career Vision" if completed
- Always accessible from main navigation

### 2. Fast-Track Job Search
- Use `ideal_work_preferences` to score job matches
- Filter by "Must have" criteria (weight = 'M')
- Display compatibility score on job cards
- Prioritize jobs matching high-weight preferences

### 3. Resume Builder
- Suggest skills from `career_vision_profiles.skills_knowledge`
- Align resume tone with identified values
- Highlight experiences matching career vision

### 4. Dashboard Enhancement
- Add "Career Vision" widget showing completion %
- Quick navigation to incomplete sections
- Display career vision statement

### 5. App Routing Updates

**New Route Priority:**
```typescript
// After successful sign-up:
if (newUser && !hasSeenCareerVisionPrompt) {
  redirect('/career-vision/welcome')  // NEW: First stop
} else if (needsOnboarding) {
  redirect('/onboarding')  // Existing flow
} else {
  redirect('/dashboard')
}
```

**Career Vision Routes:**
```
/career-vision/welcome           - Optional prompt page
/career-vision/dashboard         - Progress overview
/career-vision/skills-values     - Step 1: Skills, Values, Interests
/career-vision/job-history       - Step 2: Past jobs analysis
/career-vision/preferences       - Step 3: Work preferences
/career-vision/summary           - Final: Vision statement & insights
```

## AI-Powered Features

### Analysis Logic (OpenAI Integration)

**Endpoint: POST /api/career-vision/analyze**

Capabilities:
- Analyze job history patterns (satisfiers/dissatisfiers)
- Generate personalized career vision statement
- Identify skill gaps and development opportunities
- Suggest compatible career paths
- Match user preferences with available jobs
- Provide actionable recommendations

**AI Prompt Structure:**
```javascript
{
  systemPrompt: "You are a career coach analyzing career vision data...",
  userProfile: {
    skills: [...],
    values: [...],
    interests: [...],
    jobHistory: [...],
    preferences: {...}
  },
  task: "Analyze patterns and provide insights..."
}
```

## Implementation Roadmap

**PRIORITY: Build Career Vision as the FIRST major feature after authentication.**

### Sprint 1: Foundation & Welcome Flow (Week 1-2)
- [ ] Update `user_profiles` table with Career Vision flags
- [ ] Create Career Vision database tables (3 tables)
- [ ] Set up RLS policies in Supabase
- [ ] Create backend API routes structure
- [ ] Build Welcome page (`/career-vision/welcome`)
- [ ] Update sign-up flow to redirect to Welcome page
- [ ] Add routing logic for optional flow
- [ ] Add navigation menu items

### Sprint 2: Skills, Values, Interests (Week 3)
- [ ] Build CareerVision Dashboard page
- [ ] Build SkillsValues interactive form
- [ ] Implement Venn diagram visualization
- [ ] Connect to backend APIs
- [ ] Add form validation

### Sprint 3: Job History (Week 4)
- [ ] Build JobHistory page and components
- [ ] Implement CRUD operations
- [ ] Add form for up to 4 jobs
- [ ] Create pattern visualization
- [ ] Add AI pattern recognition

### Sprint 4: Work Preferences (Week 5)
- [ ] Build WorkPreferences questionnaire
- [ ] Implement weight system (M, 10-1)
- [ ] Create priority visualization
- [ ] Build summary generation
- [ ] Add preference validation

### Sprint 5: Integration (Week 6)
- [ ] Integrate with Fast-Track job search
- [ ] Add job scoring algorithm
- [ ] Connect to Resume Builder suggestions
- [ ] Add Dashboard widgets
- [ ] Update onboarding flow

### Sprint 6: AI Enhancement (Week 7)
- [ ] Implement AI analysis endpoint
- [ ] Generate career vision statements
- [ ] Provide personalized recommendations
- [ ] Add insights panel
- [ ] Testing and refinement

## Technical Architecture

```
CareerVision Module
├── Database Layer (Supabase)
│   ├── career_vision_profiles
│   ├── job_history_analysis
│   └── ideal_work_preferences
│
├── Backend API
│   ├── /routes/career-vision.js
│   │   ├── Profile endpoints
│   │   ├── Job History CRUD
│   │   ├── Preferences endpoints
│   │   └── AI analysis
│   └── OpenAI Integration
│       └── Career insights generation
│
├── Frontend
│   ├── /pages/CareerVision/
│   │   ├── Dashboard.tsx
│   │   ├── SkillsValues.tsx
│   │   ├── JobHistory.tsx
│   │   ├── WorkPreferences.tsx
│   │   └── Summary.tsx
│   └── /components/career-vision/
│       ├── VennDiagram.tsx
│       ├── JobHistoryCard.tsx
│       ├── PreferenceInput.tsx
│       ├── CareerVisionProgress.tsx
│       └── InsightsPanel.tsx
│
└── Integration Points
    ├── Fast-Track Job Search
    │   └── Job scoring & filtering
    ├── Resume Builder
    │   └── Skills & values suggestions
    ├── Dashboard
    │   └── Progress widgets
    └── Onboarding
        └── Career Vision step
```

## Key Algorithms

### Job Matching Score
```javascript
function calculateJobMatchScore(job, preferences) {
  let score = 0
  let maxScore = 0

  // Check each preference category
  for (const [category, data] of Object.entries(preferences)) {
    const weight = data.weight

    // Must-have requirements
    if (weight === 'M' && !job.matches(category, data.preference)) {
      return 0 // Automatic disqualification
    }

    // Weighted scoring (1-10)
    if (weight !== 'M') {
      const weightValue = parseInt(weight)
      maxScore += weightValue

      if (job.matches(category, data.preference)) {
        score += weightValue
      }
    }
  }

  return (score / maxScore) * 100 // Percentage match
}
```

### Career Vision Statement Generation
```javascript
async function generateCareerVisionStatement(profile) {
  const prompt = `
    Based on the following career profile:

    Skills & Knowledge: ${profile.skills_knowledge.join(', ')}
    Core Values: ${profile.core_values.join(', ')}
    Interests: ${profile.interests.join(', ')}

    Generate a concise, inspiring career vision statement (2-3 sentences)
    that captures where their skills, values, and interests intersect.
  `

  return await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }]
  })
}
```

## Success Metrics

### User Engagement
- % of users who complete Career Vision module
- Time spent on each section
- Return rate to update preferences

### Feature Impact
- Job match quality improvement (user feedback)
- Interview conversion rate for matched jobs
- Resume quality scores (AI evaluation)

### Business Metrics
- User retention improvement
- Feature adoption rate
- User satisfaction (NPS for Career Vision)

## Next Steps

1. **Review and approve** this implementation plan
2. **Create database migrations** for the three new tables
3. **Set up RLS policies** in Supabase for data security
4. **Begin Sprint 1** with backend foundation
5. **Design UI mockups** for all Career Vision pages

---

## Summary of Changes (v2.0)

**Key Updates:**
1. **Priority Change**: Career Vision is now an **optional FIRST feature** immediately after sign-up
2. **New Welcome Page**: Added `/career-vision/welcome` as entry point
3. **Updated User Flow**: `Sign Up → Career Vision (Optional) → Onboarding → Dashboard`
4. **Database Flags**: Added tracking for `career_vision_started`, `career_vision_completed`, `career_vision_skipped`, `has_seen_career_vision_prompt`
5. **Routing Logic**: New conditional logic to show Career Vision prompt to new users
6. **Always Accessible**: Dashboard widget and navigation menu provide return access

**Philosophy:**
- Some users need Career Vision FIRST to discover their direction
- Other users already know what they want and should skip directly to job search
- The system should guide but never force

---

**Document Version**: 2.0
**Created**: 2025-11-26
**Last Updated**: 2025-11-26
**Status**: Ready for Implementation - Priority Feature
