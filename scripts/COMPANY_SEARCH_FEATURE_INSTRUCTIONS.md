# Company Search Feature - Implementation Instructions

## Overview
Add intelligent company search functionality to the Company Shortlist tab that suggests companies based on:
1. Target Company Criteria (Step 1)
2. Industry Research (Step 2)

## Implementation Plan

### Phase 1: Manual Research Helper (CURRENT - Simple Implementation)
Add a button that opens helpful search links based on user's criteria.

### Phase 2: AI-Powered Suggestions (FUTURE)
Use AI to analyze criteria and suggest specific companies.

---

## Phase 1 Implementation (DO THIS NOW)

### 1. Add State Variables (after line 31 in CompanyShortlist.tsx)

```typescript
const [showForm, setShowForm] = useState(false)
const [searching, setSearching] = useState(false)  // ADD THIS
const [userCriteria, setUserCriteria] = useState<any>(null)  // ADD THIS
const [userIndustries, setUserIndustries] = useState<any[]>([])  // ADD THIS
```

### 2. Add Function to Load User Criteria (after loadCompanies function)

```typescript
const loadUserContext = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Load target criteria
    const { data: criteria } = await supabase
      .from('target_company_criteria')
      .select('*')
      .eq('user_id', user.id)
      .single()

    setUserCriteria(criteria)

    // Load industry research
    const { data: industries } = await supabase
      .from('industry_research')
      .select('*')
      .eq('user_id', user.id)

    setUserIndustries(industries || [])
  } catch (error) {
    console.error('Error loading user context:', error)
  }
}
```

### 3. Call loadUserContext in useEffect

```typescript
useEffect(() => {
  loadCompanies()
  loadUserContext()  // ADD THIS LINE
}, [])
```

### 4. Add Search Helper Function

```typescript
const handleFindCompanies = () => {
  if (!userCriteria || userIndustries.length === 0) {
    alert('Please complete Target Criteria and Industry Research first!')
    return
  }

  setSearching(true)

  // Build search queries based on user's criteria
  const industry = userCriteria.industry || ''
  const geography = userCriteria.geography || ''
  const companySize = userCriteria.company_size || ''

  // Open search tabs with pre-filled queries
  const searches = [
    {
      name: 'LinkedIn Companies',
      url: `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(industry + ' ' + geography)}`
    },
    {
      name: 'Google Search',
      url: `https://www.google.com/search?q=top+companies+${encodeURIComponent(industry + ' ' + geography)}`
    },
    {
      name: 'Built In (Tech)',
      url: `https://builtin.com/companies?industries=${encodeURIComponent(industry)}`
    },
    {
      name: 'Crunchbase',
      url: `https://www.crunchbase.com/discover/organization.companies?query=${encodeURIComponent(industry)}`
    }
  ]

  // Show modal with search links
  alert(`Opening search tabs for:\n- Industry: ${industry}\n- Location: ${geography}\n\nCheck the browser tabs that opened!`)

  // Open tabs (note: popup blockers might prevent this)
  searches.forEach((search, index) => {
    setTimeout(() => {
      window.open(search.url, '_blank')
    }, index * 500)  // Stagger to avoid popup blocker
  })

  setSearching(false)
}
```

### 5. Add "Find Companies" Button (replace the existing "Add Company" button section)

```typescript
{/* Action Buttons */}
<div className="flex items-center gap-3">
  {!showForm && (
    <>
      <button
        onClick={handleFindCompanies}
        disabled={!userCriteria || userIndustries.length === 0}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Sparkles className="w-5 h-5" />
        {searching ? 'Searching...' : 'Find Companies'}
      </button>
      <button
        onClick={() => setShowForm(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add Manually
      </button>
    </>
  )}
</div>
```

### 6. Add Helper Text in Instructions Section

Update the instructions box to mention the new feature:

```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <h3 className="font-semibold text-blue-900 mb-2">Build Your Target Company List</h3>
  <p className="text-sm text-blue-800 mb-2">
    Create a list of 35-50 companies that match your criteria. This focused approach:
  </p>
  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
    <li>Gives you clear targets instead of applying randomly</li>
    <li>Allows you to research each company deeply</li>
    <li>Makes networking and referrals more strategic</li>
    <li>Increases your interview rate by 3x</li>
  </ul>
  <div className="mt-3 pt-3 border-t border-blue-300">
    <p className="text-sm font-semibold text-blue-900 mb-1">
      ✨ New: Click "Find Companies" to discover companies matching your criteria!
    </p>
    <p className="text-xs text-blue-700">
      We'll search LinkedIn, Crunchbase, and other sources based on your Target Criteria and Industry Research.
    </p>
  </div>
</div>
```

---

## Testing Steps

1. Go to Target Criteria tab and fill in:
   - Industry (e.g., "SaaS")
   - Geography (e.g., "Remote, US")
   - Company size

2. Go to Industry Research tab and add at least one industry

3. Go to Company Shortlist tab

4. Click "Find Companies" button

5. Browser should open 4 tabs with pre-filled searches:
   - LinkedIn Companies search
   - Google search for top companies
   - Built In (tech companies)
   - Crunchbase

6. User can browse these sites and manually add companies they like using "Add Manually" button

---

## Future Enhancements (Phase 2)

- Add AI-powered company suggestions using OpenAI API
- Scrape company data automatically
- Show suggested companies in a modal with "Add All" button
- Track which sources found each company
- Auto-fill company details (website, LinkedIn, size) from public data

---

## Notes

- Phase 1 is a simple helper that opens search tabs
- User still needs to manually add companies they find
- Phase 2 would use AI to actually suggest specific companies
- This approach respects rate limits and doesn't require API keys initially

