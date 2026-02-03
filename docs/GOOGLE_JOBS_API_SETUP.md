# Google Jobs API Setup Guide

## Overview

Google doesn't offer a direct "Google Jobs API" - instead, we'll use **SerpAPI** which provides access to Google Jobs search results through a clean REST API.

## Option 1: SerpAPI (Recommended)

### Why SerpAPI?
- ✅ Direct access to Google Jobs results
- ✅ Free tier: 100 searches/month
- ✅ Easy to use REST API
- ✅ No complex setup
- ✅ Returns structured JSON data
- ✅ Supports all job search parameters

### Step 1: Create SerpAPI Account

1. Go to [https://serpapi.com/](https://serpapi.com/)
2. Click "Sign Up" (top right)
3. Sign up with:
   - Email
   - Google account
   - GitHub account

### Step 2: Get Your API Key

1. After signing up, you'll be redirected to your dashboard
2. Your API key is displayed at the top: `Your API Key: xxxxxxxxxxxxx`
3. Copy this key - you'll need it for the `.env` file

### Step 3: Verify Your Free Tier

- **Free Plan**: 100 searches/month
- **No credit card required**
- If you need more searches:
  - Developer: $50/month (5,000 searches)
  - Production: $150/month (15,000 searches)

### Step 4: Test Your API Key

You can test your API key immediately with curl:

```bash
curl "https://serpapi.com/search.json?engine=google_jobs&q=Data+Analyst+Utah&api_key=YOUR_API_KEY"
```

You should get back JSON with job results.

---

## Option 2: RapidAPI - JSearch (Alternative)

### Why JSearch?
- ✅ More comprehensive job data
- ✅ Multiple job boards (Google, LinkedIn, Indeed, etc.)
- ✅ Company information included
- ✅ Salary estimates
- ❌ Paid only (no free tier)

### Step 1: Create RapidAPI Account

1. Go to [https://rapidapi.com/](https://rapidapi.com/)
2. Click "Sign Up"
3. Create account with email or Google

### Step 2: Subscribe to JSearch

1. Go to [JSearch API page](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch)
2. Click "Subscribe to Test"
3. Choose a plan:
   - **Basic**: Free (but limited to 10 requests/month)
   - **Pro**: $9.99/month (1,000 requests)
   - **Ultra**: $49.99/month (10,000 requests)

### Step 3: Get Your API Keys

After subscribing:
1. Go to the "Code Snippets" section
2. You'll see two keys:
   - `X-RapidAPI-Key`: Your API key
   - `X-RapidAPI-Host`: `jsearch.p.rapidapi.com`

---

## Recommended Choice: SerpAPI

For CareerTipsAI, I recommend **SerpAPI** because:

1. **Free tier is sufficient** for development and initial users (100 searches/month)
2. **Simple integration** - just one API key needed
3. **Direct Google Jobs data** - exactly what users expect
4. **No credit card required** to start

---

## Implementation Plan

Once you have your SerpAPI key, we'll:

1. **Add API key to environment variables**
   ```env
   SERPAPI_KEY=your_api_key_here
   ```

2. **Create Supabase Edge Function** (backend endpoint)
   - Located at: `supabase/functions/search-jobs/index.ts`
   - Calls SerpAPI with user's search parameters
   - Returns normalized job data

3. **Update CompanyShortlist component**
   - Replace hardcoded `companyDatabase`
   - Call Supabase Edge Function
   - Display real job results with:
     - Job title
     - Company name
     - Location
     - Salary (if available)
     - Apply link
     - Posted date

4. **Add loading states and error handling**
   - Show loading spinner while searching
   - Handle API errors gracefully
   - Cache results in localStorage

---

## API Response Example

### SerpAPI Response Structure

```json
{
  "search_metadata": {
    "status": "Success"
  },
  "jobs_results": [
    {
      "title": "Senior Data Analyst",
      "company_name": "MX Technologies",
      "location": "Lehi, UT",
      "via": "LinkedIn",
      "description": "We are seeking a Senior Data Analyst...",
      "job_highlights": [
        {
          "title": "Qualifications",
          "items": ["5+ years experience", "SQL expertise"]
        }
      ],
      "related_links": [
        {
          "link": "https://www.linkedin.com/jobs/view/...",
          "text": "Apply on LinkedIn"
        }
      ],
      "extensions": ["Full-time", "$100K-$140K a year"],
      "detected_extensions": {
        "posted_at": "2 days ago",
        "salary": "$100K-$140K a year",
        "schedule_type": "Full-time"
      }
    }
  ]
}
```

---

## Next Steps

1. **Get your SerpAPI key** from [serpapi.com](https://serpapi.com/)
2. **Share the API key** with me (or add it to `.env.local` as `VITE_SERPAPI_KEY`)
3. I'll implement the integration immediately

---

## Cost Estimation

### Development Phase (first 3 months)
- **Free tier**: 100 searches/month = plenty for testing and initial users
- **Cost**: $0

### Production (100 active users)
- Assume each user does 5 searches/month = 500 searches/month
- **Plan needed**: Developer ($50/month for 5,000 searches)
- **Cost per user**: $0.50/month

### Production (500 active users)
- 500 users × 5 searches = 2,500 searches/month
- **Plan needed**: Developer ($50/month for 5,000 searches)
- **Cost per user**: $0.10/month

**Conclusion**: Very affordable even at scale.

---

## Alternative: Build Without API (Not Recommended)

If you want to avoid API costs entirely, we could:
- ❌ Web scrape Google Jobs (violates ToS, unreliable)
- ❌ Use LinkedIn API (very limited, expensive)
- ❌ Keep hardcoded database (not useful for users)

**Verdict**: API integration is the only viable solution for real-time job search.

---

## Support

If you encounter issues:
1. SerpAPI Support: [https://serpapi.com/contact](https://serpapi.com/contact)
2. Documentation: [https://serpapi.com/google-jobs-api](https://serpapi.com/google-jobs-api)
3. Check API status: [https://serpapi.com/status](https://serpapi.com/status)
