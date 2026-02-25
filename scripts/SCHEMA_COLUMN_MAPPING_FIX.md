# Schema Column Mapping Fix ✅

## Date: 2025-11-21

## Problem

The JD Analyzer was using incorrect column names that didn't match the actual database schema, causing 400 errors:

```
❌ column par_stories.problem does not exist
❌ column par_stories.action does not exist
❌ column work_experience.company does not exist
❌ column job_description_analysis.jd_text does not exist
❌ column job_description_analysis.extracted_keywords does not exist
❌ column job_description_analysis.match_score does not exist
```

## Root Cause

The code was written assuming column names that didn't exist in the `FINAL_RESUME_SCHEMA.sql`. The actual schema uses different naming conventions.

---

## Column Name Mappings

### 1. `par_stories` Table

| ❌ Old (Incorrect) | ✅ New (Correct)       | Type   |
|-------------------|------------------------|--------|
| `problem`         | `problem_challenge`    | TEXT   |
| `action`          | `actions`              | JSONB  |
| `result`          | `result`               | TEXT ✓ |

**Note:** `actions` is JSONB array, not a simple string.

### 2. `work_experience` Table

| ❌ Old (Incorrect) | ✅ New (Correct)  | Type |
|-------------------|-------------------|------|
| `company`         | `company_name`    | TEXT |
| `description`     | `role_summary`    | TEXT |
| `job_title`       | `job_title`       | TEXT ✓ |

### 3. `job_description_analysis` Table

| ❌ Old (Incorrect)      | ✅ New (Correct)          | Type  |
|------------------------|---------------------------|-------|
| `jd_text`              | `job_description_text`    | TEXT  |
| `extracted_keywords`   | `top_keywords`            | JSONB |
| `match_score`          | `extracted_requirements` (nested) | JSONB |

**Note:** `match_score` is now stored inside `extracted_requirements` as: `{ match_score: 87 }`

---

## Files Fixed

### 1. `/frontend/src/pages/resume-builder/JDAnalyzer.tsx`

#### A. Query Fix - `loadResumeData()`

**Before:**
```typescript
// ❌ WRONG
const { data: parStories } = await supabase
  .from('par_stories')
  .select('problem, action, result')
  .eq('user_id', uid)

const { data: workExp } = await supabase
  .from('work_experience')
  .select('job_title, company, description')
  .eq('resume_id', resId)
```

**After:**
```typescript
// ✅ CORRECT
const { data: parStories } = await supabase
  .from('par_stories')
  .select('problem_challenge, actions, result')
  .eq('user_id', uid)

const { data: workExp } = await supabase
  .from('work_experience')
  .select('job_title, company_name, role_summary')
  .eq('resume_id', resId)
```

#### B. Insert Fix - `handleAnalyze()`

**Before:**
```typescript
// ❌ WRONG
const { data, error } = await supabase
  .from('job_description_analysis')
  .insert({
    user_id: userId,
    resume_id: resumeId,
    job_title: jobTitle,
    company_name: companyName,
    jd_text: jdText,                    // ❌ Wrong column name
    extracted_keywords: matchedKeywords, // ❌ Wrong column name
    keyword_mapping: keywordMapping,
    match_score: matchScore              // ❌ Wrong column name
  })
```

**After:**
```typescript
// ✅ CORRECT
const { data, error } = await supabase
  .from('job_description_analysis')
  .insert({
    user_id: userId,
    job_title: jobTitle,
    company_name: companyName,
    job_description_text: jdText,        // ✅ Correct
    top_keywords: matchedKeywords,       // ✅ Correct
    keyword_mapping: keywordMapping,
    extracted_requirements: { match_score: matchScore } // ✅ Nested
  })
```

#### C. Load Analysis Fix - `handleLoadAnalysis()`

**Before:**
```typescript
// ❌ WRONG
setJdText(savedAnalysis.jd_text || '')
setAnalysis({
  jd_text: savedAnalysis.jd_text,
  extracted_keywords: savedAnalysis.extracted_keywords || [],
  match_score: savedAnalysis.match_score
})
```

**After:**
```typescript
// ✅ CORRECT
setJdText(savedAnalysis.job_description_text || '')
setAnalysis({
  jd_text: savedAnalysis.job_description_text,
  extracted_keywords: savedAnalysis.top_keywords || [],
  match_score: savedAnalysis.extracted_requirements?.match_score || 0
})
```

#### D. Saved Analyses Display Fix

**Before:**
```typescript
// ❌ WRONG
{sa.match_score && (
  <span>{sa.match_score}% match</span>
)}
```

**After:**
```typescript
// ✅ CORRECT
{sa.extracted_requirements?.match_score && (
  <span>{sa.extracted_requirements.match_score}% match</span>
)}
```

---

### 2. `/frontend/src/lib/openaiService.ts`

#### A. Interface Update

**Before:**
```typescript
// ❌ WRONG
export interface ResumeData {
  par_stories?: Array<{
    problem: string
    action: string
    result: string
  }>
  work_experience?: Array<{
    job_title: string
    company: string
    description: string
  }>
}
```

**After:**
```typescript
// ✅ CORRECT
export interface ResumeData {
  par_stories?: Array<{
    problem_challenge: string
    actions: any // JSONB array
    result: string
  }>
  work_experience?: Array<{
    job_title: string
    company_name: string
    role_summary?: string
  }>
}
```

#### B. Text Building Fix - `buildResumeText()`

**Before:**
```typescript
// ❌ WRONG
const stories = resumeData.par_stories.map((story, idx) =>
  `Story ${idx + 1}:\nProblem: ${story.problem}\nAction: ${story.action}\nResult: ${story.result}`
).join('\n\n')

const experiences = resumeData.work_experience.map((exp, idx) =>
  `${idx + 1}. ${exp.job_title} at ${exp.company}\n${exp.description}`
).join('\n\n')
```

**After:**
```typescript
// ✅ CORRECT
const stories = resumeData.par_stories.map((story, idx) => {
  const actionsText = Array.isArray(story.actions)
    ? story.actions.join(', ')
    : typeof story.actions === 'string'
    ? story.actions
    : JSON.stringify(story.actions)

  return `Story ${idx + 1}:\nProblem: ${story.problem_challenge}\nActions: ${actionsText}\nResult: ${story.result}`
}).join('\n\n')

const experiences = resumeData.work_experience.map((exp, idx) =>
  `${idx + 1}. ${exp.job_title} at ${exp.company_name}\n${exp.role_summary || ''}`
).join('\n\n')
```

---

## Special Handling

### JSONB `actions` Field

The `actions` field in `par_stories` is JSONB, so it needs special handling:

```typescript
const actionsText = Array.isArray(story.actions)
  ? story.actions.join(', ')           // If array: ["action1", "action2"]
  : typeof story.actions === 'string'
  ? story.actions                      // If string: "action text"
  : JSON.stringify(story.actions)      // If object: { key: value }
```

### Nested `match_score`

The `match_score` is now nested inside `extracted_requirements`:

```typescript
// Save
extracted_requirements: { match_score: 87 }

// Load
const score = savedAnalysis.extracted_requirements?.match_score || 0
```

---

## Testing Checklist

✅ PAR stories query uses correct column names
✅ Work experience query uses correct column names
✅ JD analysis insert uses correct column names
✅ Saved analyses load correctly
✅ Match score displays correctly in saved analyses list
✅ JSONB actions field is handled properly
✅ No more 400 errors from Supabase

---

## Database Schema Reference

For reference, here are the actual table definitions:

```sql
-- PAR Stories
CREATE TABLE IF NOT EXISTS par_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE,

  role_company TEXT NOT NULL,
  year TEXT,
  problem_challenge TEXT NOT NULL,  -- ✅ Not "problem"
  actions JSONB,                     -- ✅ Not "action", and it's JSONB
  result TEXT NOT NULL,
  metrics TEXT[],
  ...
);

-- Work Experience
CREATE TABLE IF NOT EXISTS work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES user_resumes(id) ON DELETE CASCADE NOT NULL,

  company_name TEXT NOT NULL,        -- ✅ Not "company"
  company_description TEXT,
  location_city TEXT,
  location_country TEXT,

  job_title TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,

  role_summary TEXT,                 -- ✅ Not "description"
  ...
);

-- Job Description Analysis
CREATE TABLE IF NOT EXISTS job_description_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  job_title TEXT NOT NULL,
  company_name TEXT,
  job_description_text TEXT NOT NULL,  -- ✅ Not "jd_text"
  jd_url TEXT,

  top_keywords JSONB,                  -- ✅ Not "extracted_keywords"
  extracted_requirements JSONB,        -- ✅ Contains match_score
  keyword_mapping JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Summary

All column name mismatches have been fixed. The JD Analyzer now:

1. ✅ Correctly queries `par_stories` using `problem_challenge` and `actions`
2. ✅ Correctly queries `work_experience` using `company_name` and `role_summary`
3. ✅ Correctly inserts into `job_description_analysis` using proper column names
4. ✅ Properly handles JSONB `actions` field
5. ✅ Stores and retrieves `match_score` from nested `extracted_requirements`

**No more 400 errors! The JD Analyzer is now fully compatible with the database schema.** 🎉
