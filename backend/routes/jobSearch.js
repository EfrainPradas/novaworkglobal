import express from 'express'
import axios from 'axios'
import { OpenAI } from 'openai'

import { requireAuth } from '../middleware/auth.js'

const router = express.Router()

// 🔒 Security: Require authentication for all job search routes
router.use(requireAuth)

// Initialize OpenAI only if API key is available
let openai = null
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_KEY_HERE') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  })
}

/**
 * POST /api/jobs/search
 * Search for jobs using SerpAPI (Google Jobs)
 *
 * Request body:
 * {
 *   query: string,          // e.g., "Data Analyst"
 *   location: string,       // e.g., "Utah"
 *   industry?: string,      // e.g., "FinTech"
 *   companySize?: string,   // e.g., "startup"
 *   limit?: number          // default: 10
 * }
 */
router.post('/search', async (req, res) => {
  try {
    const { query, location, industry, companySize, limit = 10 } = req.body

    // Validate required fields
    if (!query || !location) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'query and location are required'
      })
    }

    // Check for API key
    const apiKey = process.env.SERPAPI_KEY
    if (!apiKey || apiKey === 'YOUR_SERPAPI_KEY_HERE') {
      return res.status(500).json({
        error: 'API key not configured',
        details: 'SERPAPI_KEY is not set in environment variables. Please add it to .env',
        demoMode: true
      })
    }

    console.log(`🔍 Searching jobs: "${query}" in "${location}"${industry ? ` (${industry})` : ''}`)

    // Build search query
    let searchQuery = `${query} ${location}`
    if (industry) {
      searchQuery += ` ${industry}`
    }

    // Call SerpAPI
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_jobs',
        q: searchQuery,
        api_key: apiKey,
        num: limit,
        hl: 'en'
      },
      timeout: 10000 // 10 second timeout
    })

    // Check for API errors
    if (response.data.error) {
      console.error('❌ SerpAPI error:', response.data.error)
      return res.status(500).json({
        error: 'Job search failed',
        details: response.data.error
      })
    }

    // Extract job results
    const jobs = response.data.jobs_results || []

    console.log(`✅ Found ${jobs.length} jobs`)

    // Normalize job data
    const normalizedJobs = jobs.map((job, index) => {
      // Extract salary info
      let salary = null
      if (job.detected_extensions?.salary) {
        salary = job.detected_extensions.salary
      } else {
        // Look for salary in extensions array
        const salaryExt = job.extensions?.find(ext =>
          ext.toLowerCase().includes('$') ||
          ext.toLowerCase().includes('k') ||
          ext.toLowerCase().includes('year') ||
          ext.toLowerCase().includes('hour')
        )
        if (salaryExt) salary = salaryExt
      }

      // Extract company size if available
      const companyInfo = job.detected_extensions?.company_size || null

      // Extract posted date
      const postedAt = job.detected_extensions?.posted_at || 'Recently'

      // Extract apply link
      const applyLink = job.apply_options?.[0]?.link ||
        job.related_links?.[0]?.link ||
        job.share_link ||
        null

      // Calculate match score based on criteria
      let matchScore = 70 // Base score

      // Boost score if industry matches
      if (industry && job.description?.toLowerCase().includes(industry.toLowerCase())) {
        matchScore += 15
      }

      // Boost score if company size matches
      if (companySize && companyInfo) {
        const sizeLower = companySize.toLowerCase()
        const companyLower = companyInfo.toLowerCase()

        if (sizeLower.includes('startup') && (companyLower.includes('1-50') || companyLower.includes('small'))) {
          matchScore += 10
        } else if (sizeLower.includes('mid') && companyLower.includes('51-200')) {
          matchScore += 10
        }
      }

      // Boost if salary is mentioned
      if (salary) {
        matchScore += 5
      }

      return {
        id: job.job_id || `job-${index}`,
        title: job.title,
        company: job.company_name,
        location: job.location,
        description: job.description,
        salary: salary,
        companySize: companyInfo,
        postedAt: postedAt,
        applyLink: applyLink,
        source: job.via || 'Google Jobs',
        matchScore: Math.min(matchScore, 100), // Cap at 100
        highlights: job.job_highlights || [],
        thumbnail: job.thumbnail || null,

        // Original data for reference
        _raw: {
          extensions: job.extensions,
          detected_extensions: job.detected_extensions
        }
      }
    })

    // Sort by match score (highest first)
    normalizedJobs.sort((a, b) => b.matchScore - a.matchScore)

    // Return results
    res.json({
      success: true,
      query: searchQuery,
      count: normalizedJobs.length,
      jobs: normalizedJobs,
      metadata: {
        searchedAt: new Date().toISOString(),
        source: 'SerpAPI - Google Jobs'
      }
    })

  } catch (error) {
    console.error('❌ Job search error:', error.message)

    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Search timeout',
        details: 'The job search took too long to respond. Please try again.'
      })
    }

    if (error.response) {
      // API returned an error response
      return res.status(error.response.status).json({
        error: 'API error',
        details: error.response.data?.error || error.message
      })
    }

    // Generic error
    res.status(500).json({
      error: 'Job search failed',
      details: error.message
    })
  }
})

/**
 * GET /api/jobs/test
 * Test endpoint to verify API key works
 */
router.get('/test', async (req, res) => {
  try {
    const apiKey = process.env.SERPAPI_KEY

    if (!apiKey) {
      return res.status(500).json({
        error: 'API key not configured',
        configured: false
      })
    }

    // Make a minimal test request
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_jobs',
        q: 'Software Engineer Remote',
        api_key: apiKey,
        num: 1
      },
      timeout: 5000
    })

    res.json({
      success: true,
      configured: true,
      apiWorking: true,
      accountInfo: {
        searches_remaining: response.data.search_metadata?.total_time_taken || 'N/A'
      }
    })

  } catch (error) {
    res.status(500).json({
      error: 'API test failed',
      configured: !!process.env.SERPAPI_KEY,
      apiWorking: false,
      details: error.message
    })
  }
})

/**
 * POST /api/jobs/recommendations
 * AI-powered job recommendations based on user profile
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { userId, userProfile, limit = 10 } = req.body

    if (!userId || !userProfile) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'userId and userProfile are required'
      })
    }

    // Check for required API keys
    const serpApiKey = process.env.SERPAPI_KEY
    if (!serpApiKey || serpApiKey === 'YOUR_SERPAPI_KEY_HERE') {
      // Return demo data
      return res.json({
        success: true,
        recommendations: generateDemoRecommendations(limit),
        metadata: {
          userId,
          generatedAt: new Date().toISOString(),
          demoMode: true,
          message: 'Demo mode - Set SERPAPI_KEY and OPENAI_API_KEY to get real recommendations'
        }
      })
    }

    console.log(`🎯 Generating AI recommendations for user: ${userId}`)

    // 1. Extract key preferences from user profile
    const userSkills = userProfile.skills?.join(', ') || ''
    const userPreferences = userProfile.preferences?.ideal_work || {}
    const userLocation = userProfile.preferences?.geographic_location?.[0] || 'Remote'
    const targetRoles = userProfile.career_vision?.target_roles || []

    // 2. Build comprehensive search queries
    const searchQueries = []

    // Add target roles from career vision
    targetRoles.forEach(role => {
      searchQueries.push(`${role} ${userLocation}`)
    })

    // Add skills-based queries
    if (userSkills) {
      searchQueries.push(`${userSkills.split(',').slice(0, 3).join(' ')} ${userLocation}`)
    }

    // Add industry preferences
    if (userPreferences.industry) {
      searchQueries.push(`${userPreferences.industry} ${userLocation}`)
    }

    console.log(`🔍 Building ${searchQueries.length} search queries: ${searchQueries.join(', ')}`)

    // 3. Search multiple sources
    const allJobs = []

    for (const query of searchQueries.slice(0, 3)) { // Limit to prevent timeout
      try {
        console.log(`🔎 Searching for: "${query}"`)
        const response = await axios.get('https://serpapi.com/search.json', {
          params: {
            engine: 'google_jobs',
            q: query,
            api_key: process.env.SERPAPI_KEY,
            num: Math.ceil(limit / searchQueries.length) + 2,
            hl: 'en'
          },
          timeout: 8000
        })

        const jobs = response.data.jobs_results || []
        console.log(`✅ Found ${jobs.length} jobs for "${query}"`)
        allJobs.push(...jobs.map(j => ({ ...j, _searchQuery: query })))
      } catch (error) {
        console.warn(`⚠️ Query failed: "${query}" - ${error.message}`)
      }
    }

    console.log(`📊 Found ${allJobs.length} total jobs`)

    // If no jobs found (possibly SerpAPI credits exhausted), return demo data
    if (allJobs.length === 0) {
      console.log('⚠️ No jobs found from SerpAPI, returning demo data')
      const demoJobs = generateDemoRecommendations(limit)
      return res.json({
        success: true,
        recommendations: demoJobs,
        metadata: {
          userId,
          generatedAt: new Date().toISOString(),
          totalJobsFound: demoJobs.length,
          jobsAnalyzed: demoJobs.length,
          jobsRecommended: demoJobs.length,
          averageScore: 75,
          demoMode: true,
          message: 'Using demo data - SerpAPI may have no remaining credits'
        }
      })
    }

    // 4. Advanced AI-based scoring
    const scoredJobs = await Promise.all(
      allJobs.slice(0, limit * 2).map(async (job) => {
        let aiScore = 50 // Base score

        // Pre-build best description from real data (available in both try and catch)
        const hasDescription = job.description && job.description.trim().length > 50
        const hasHighlights = job.job_highlights && job.job_highlights.length > 0
        let bestDescription = job.description || ''
        if (!bestDescription && hasHighlights) {
          bestDescription = job.job_highlights.map(h =>
            `${h.title}:\n${h.items.map(i => `• ${i}`).join('\n')}`
          ).join('\n\n')
        }

        try {
          const analysisPrompt = `
Analyze this job match for a user with the following profile:

USER PROFILE:
- Skills: ${userSkills}
- Career Vision: ${JSON.stringify(userProfile.career_vision || {})}
- Work Preferences: ${JSON.stringify(userPreferences)}
- Target Roles: ${targetRoles.join(', ')}

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company_name}
- Description: ${job.description?.slice(0, 500) || 'Not provided'}
- Location: ${job.location}
- Highlights: ${JSON.stringify(job.job_highlights || [])}

Rate this job match from 0-100 considering:
1. Skills alignment (40% weight)
2. Career path alignment (25% weight)
3. Work preferences match (20% weight)
4. Growth potential (15% weight)

Return only a JSON object with:
{
  "score": 0-100,
  "reasoning": "Brief explanation of the score",
  "key_matches": ["list of key matching factors"],
  "potential_concerns": ["list of potential concerns"],
  "generated_description": "Write a realistic 200-word job description for this role based on the title, company, and any available details. Include likely responsibilities and requirements."
}
`

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 600,
            temperature: 0.2,
            response_format: { type: 'json_object' }
          })

          const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content)
          aiScore = aiAnalysis.score || 50

          // Upgrade description with AI-generated if still empty
          if (!bestDescription && aiAnalysis.generated_description) {
            bestDescription = aiAnalysis.generated_description
          }

          return {
            id: job.job_id || `job-${Math.random()}`,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: bestDescription,
            salary: job.detected_extensions?.salary || null,
            postedAt: job.detected_extensions?.posted_at || 'Recently',
            applyLink: job.apply_options?.[0]?.link || null,
            source: job.via || 'Google Jobs',

            // Advanced scoring
            matchScore: Math.min(aiScore, 100),
            aiAnalysis: {
              reasoning: aiAnalysis.reasoning,
              keyMatches: aiAnalysis.key_matches || [],
              potentialConcerns: aiAnalysis.potential_concerns || []
            },

            // Metadata
            searchQuery: job._searchQuery || '',
            recommendedAt: new Date().toISOString(),
            descriptionSource: hasDescription ? 'serpapi' : hasHighlights ? 'highlights' : (aiAnalysis.generated_description ? 'ai-generated' : 'none'),

            // Original data
            highlights: job.job_highlights || [],
            thumbnail: job.thumbnail || null
          }

        } catch (aiError) {
          console.warn(`⚠️ AI analysis failed for job: ${job.title} - ${aiError.message}`)

          return {
            id: job.job_id || `job-${Math.random()}`,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: bestDescription, // use pre-built description
            salary: job.detected_extensions?.salary || null,
            postedAt: job.detected_extensions?.posted_at || 'Recently',
            applyLink: job.apply_options?.[0]?.link || null,
            source: job.via || 'Google Jobs',
            matchScore: aiScore,
            recommendedAt: new Date().toISOString(),
            highlights: job.job_highlights || [],
            thumbnail: job.thumbnail || null
          }
        }
      })
    )

    // 5. Sort by AI score and remove duplicates
    const uniqueJobs = scoredJobs
      .filter((job, index, arr) =>
        arr.findIndex(j => j.title === job.title && j.company === job.company) === index
      )
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)

    console.log(`🎯 Generated ${uniqueJobs.length} AI-recommendations`)

    res.json({
      success: true,
      recommendations: uniqueJobs,
      metadata: {
        userId,
        generatedAt: new Date().toISOString(),
        totalJobsFound: allJobs.length,
        jobsAnalyzed: scoredJobs.length,
        jobsRecommended: uniqueJobs.length,
        averageScore: uniqueJobs.length > 0
          ? Math.round(uniqueJobs.reduce((sum, job) => sum + job.matchScore, 0) / uniqueJobs.length)
          : 0
      }
    })

  } catch (error) {
    console.error('❌ AI recommendations error:', error.message)
    res.status(500).json({
      error: 'AI recommendations failed',
      details: error.message
    })
  }
})

// Demo data generator for testing without API keys
function generateDemoRecommendations(limit) {
  const demoJobs = [
    {
      id: 'demo-1',
      title: 'Senior Software Engineer',
      company: 'TechCorp Solutions',
      location: 'Remote',
      description: 'We are looking for a Senior Software Engineer to join our growing team. You will work on cutting-edge projects using React, Node.js, and cloud technologies.',
      salary: '$120k - $160k',
      postedAt: '2 days ago',
      applyLink: 'https://example.com/apply/1',
      source: 'Demo',
      matchScore: 92,
      aiAnalysis: {
        reasoning: 'Excellent match based on your software engineering skills and preference for remote work',
        keyMatches: ['React experience', 'Remote work', 'Senior level', 'Tech industry'],
        potentialConcerns: ['Large company size', 'Corporate environment']
      },
      highlights: {
        'Qualifications': ['5+ years experience', 'React/Node.js', 'Cloud experience'],
        'Benefits': ['Health insurance', '401k', 'Remote work']
      },
      recommendedAt: new Date().toISOString()
    },
    {
      id: 'demo-2',
      title: 'Full Stack Developer',
      company: 'StartupHub',
      location: 'San Francisco, CA',
      description: 'Join our fast-paced startup as a Full Stack Developer. Work with modern technologies and help shape the future of our platform.',
      salary: '$100k - $140k',
      postedAt: '1 week ago',
      applyLink: 'https://example.com/apply/2',
      source: 'Demo',
      matchScore: 88,
      aiAnalysis: {
        reasoning: 'Great alignment with your startup preferences and full-stack development skills',
        keyMatches: ['Startup environment', 'Full-stack development', 'Growth opportunity'],
        potentialConcerns: ['SF location required', 'Fast-paced environment']
      },
      highlights: {
        'Qualifications': ['Full-stack experience', 'Startup experience'],
        'Benefits': ['Equity options', 'Flexible hours', 'Learning budget']
      },
      recommendedAt: new Date().toISOString()
    },
    {
      id: 'demo-3',
      title: 'Product Manager',
      company: 'InnovateTech',
      location: 'New York, NY',
      description: 'We are seeking a Product Manager to lead our product development initiatives. Experience with agile methodologies and user research required.',
      salary: '$110k - $150k',
      postedAt: '3 days ago',
      applyLink: 'https://example.com/apply/3',
      source: 'Demo',
      matchScore: 75,
      aiAnalysis: {
        reasoning: 'Good match considering your leadership experience and product knowledge',
        keyMatches: ['Product management', 'Leadership role', 'Innovation focus'],
        potentialConcerns: ['Management experience required', 'NY location']
      },
      highlights: {
        'Qualifications': ['Product management experience', 'Agile methodologies'],
        'Benefits': ['Career growth', 'Innovation culture', 'Team leadership']
      },
      recommendedAt: new Date().toISOString()
    },
    {
      id: 'demo-4',
      title: 'DevOps Engineer',
      company: 'CloudScale Inc',
      location: 'Remote',
      description: 'Looking for a DevOps Engineer to help build and maintain our cloud infrastructure. Experience with AWS, Docker, and CI/CD pipelines required.',
      salary: '$115k - $155k',
      postedAt: '5 days ago',
      applyLink: 'https://example.com/apply/4',
      source: 'Demo',
      matchScore: 83,
      aiAnalysis: {
        reasoning: 'Strong match for your technical skills and remote work preference',
        keyMatches: ['DevOps expertise', 'Cloud technologies', 'Remote flexibility'],
        potentialConcerns: ['On-call rotation', 'Infrastructure focus']
      },
      highlights: {
        'Qualifications': ['AWS/Docker experience', 'CI/CD pipelines'],
        'Benefits': ['Remote work', 'Tech challenges', 'Growth opportunity']
      },
      recommendedAt: new Date().toISOString()
    },
    {
      id: 'demo-5',
      title: 'UX/UI Designer',
      company: 'DesignFirst',
      location: 'Austin, TX',
      description: 'Creative UX/UI Designer needed for product design team. Portfolio demonstrating user-centered design principles required.',
      salary: '$90k - $120k',
      postedAt: '1 day ago',
      applyLink: 'https://example.com/apply/5',
      source: 'Demo',
      matchScore: 68,
      aiAnalysis: {
        reasoning: 'Moderate match based on your design interests and creative skills',
        keyMatches: ['Design focus', 'Creative environment', 'Product impact'],
        potentialConcerns: ['Design specialization', 'Austin location']
      },
      highlights: {
        'Qualifications': ['UX/UI portfolio', 'Design tools proficiency'],
        'Benefits': ['Creative culture', 'Product ownership', 'Design autonomy']
      },
      recommendedAt: new Date().toISOString()
    }
  ]

  return demoJobs.slice(0, limit)
}

/**
 * POST /api/jobs/company-suggestions
 * AI-powered top 10 company suggestions based on industry research + target criteria
 */
router.post('/company-suggestions', requireAuth, async (req, res) => {
  const { industries, criteria } = req.body

  if (!industries || industries.length === 0) {
    return res.status(400).json({ error: 'At least one industry is required' })
  }

  if (!openai) {
    return res.status(503).json({ error: 'AI service not available' })
  }

  try {
    const industryList = industries.map(i => i.industry_name).join(', ')
    const majorPlayersContext = industries
      .filter(i => i.major_players)
      .map(i => `- ${i.industry_name}: ${i.major_players}`)
      .join('\n')
    const growthContext = industries
      .filter(i => i.growth_outlook)
      .map(i => `- ${i.industry_name}: ${i.growth_outlook}`)
      .join('\n')

    const role = criteria?.role_function || 'professional'
    const geography = criteria?.geography || 'USA'
    const companySize = criteria?.company_size || 'Any size'
    const sector = criteria?.sector || ''
    const salaryRange = criteria?.salary_range || ''
    const revenueRange = criteria?.revenue_range || ''

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a senior career advisor specialized in company research and job search strategy.
Your task: identify exactly 10 REAL companies that are the best match for a job seeker's profile.

Rules:
- Only suggest companies that ACTUALLY EXIST as of your knowledge cutoff
- Do NOT invent companies, websites, or details
- Prioritize companies known to hire for the specified role/function
- Consider geography but include remote-friendly companies when geography is broad
- Be specific and factual — if you're unsure about a detail, use "Not enough reliable information"
- Return valid JSON with exactly 10 companies, ordered by best match first`
        },
        {
          role: 'user',
          content: `Find the top 10 companies for this job seeker:

**Target Role/Function:** ${role}
**Industries of Interest:** ${industryList}
**Preferred Geography:** ${geography}
**Company Size Preference:** ${companySize}
${sector ? `**Sector:** ${sector}` : ''}
${salaryRange ? `**Target Salary Range:** ${salaryRange}` : ''}
${revenueRange ? `**Company Revenue Preference:** ${revenueRange}` : ''}

**Known major players from the user's research:**
${majorPlayersContext || 'Not specified'}

**Industry growth context:**
${growthContext || 'Not specified'}

Return a JSON object with EXACTLY this structure:
{
  "companies": [
    {
      "company_name": "Exact company name",
      "industry": "Specific industry/sector (e.g., FinTech - Payments)",
      "headquarters": "City, State or City, Country",
      "company_size": "e.g., 500–2,000 employees",
      "website": "https://www.actualwebsite.com",
      "why_target": "2–3 sentences explaining why this company is an excellent target for this specific role and profile. Be concrete.",
      "match_score": 88,
      "recent_news": "One real, notable recent development (fundraising, IPO, product launch, expansion, acquisition). If unsure, write 'Not enough reliable information'.",
      "financials_growth": "Stage/financials: e.g., Public (NYSE: XYZ), Series D – $200M raised, Profitable – $1B ARR. If unsure, write 'Not enough reliable information'.",
      "openings_closings": "Brief note on hiring activity: are they actively growing? Any known layoffs or freezes? If unsure, write 'Not enough reliable information'.",
      "notes": "1–2 sentences of actionable context for applying: culture, interview style, unique perks, or strategic advice."
    }
  ]
}

Rank by match_score (0–100). Only include real, verifiable data.`
        }
      ]
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from AI')

    const parsed = JSON.parse(raw)

    if (!parsed.companies || !Array.isArray(parsed.companies)) {
      throw new Error('Invalid response format from AI')
    }

    const companies = parsed.companies.slice(0, 10).map(c => ({
      company_name: typeof c.company_name === 'string' ? c.company_name.trim() : '',
      industry: typeof c.industry === 'string' ? c.industry.trim() : '',
      headquarters: typeof c.headquarters === 'string' ? c.headquarters.trim() : '',
      company_size: typeof c.company_size === 'string' ? c.company_size.trim() : '',
      website: typeof c.website === 'string' ? c.website.trim() : '',
      why_target: typeof c.why_target === 'string' ? c.why_target.trim() : '',
      match_score: typeof c.match_score === 'number' ? Math.min(100, Math.max(0, Math.round(c.match_score))) : 75,
      recent_news: typeof c.recent_news === 'string' ? c.recent_news.trim() : '',
      financials_growth: typeof c.financials_growth === 'string' ? c.financials_growth.trim() : '',
      openings_closings: typeof c.openings_closings === 'string' ? c.openings_closings.trim() : '',
      notes: typeof c.notes === 'string' ? c.notes.trim() : ''
    })).filter(c => c.company_name.length > 0)

    console.log(`✅ Company suggestions generated: ${companies.length} companies for user ${req.user.email}`)
    res.json({ success: true, companies, count: companies.length })

  } catch (error) {
    console.error('Company suggestions error:', error)
    res.status(500).json({ error: 'Failed to generate company suggestions. Please try again.' })
  }
})

/**
 * POST /api/jobs/industry-autofill
 * AI-powered autofill for industry research fields
 */
router.post('/industry-autofill', async (req, res) => {
  const { industry_name } = req.body

  if (!industry_name || industry_name.trim().length < 2) {
    return res.status(400).json({ error: 'Industry name is required' })
  }

  if (!openai) {
    return res.status(503).json({ error: 'AI service not available' })
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are a career research expert. Your job is to provide accurate, job-search-oriented information about industries.

Rules:
- Be factual and concrete. Do NOT invent statistics or companies.
- If you are not confident about a field, write "Not enough reliable information" for that field.
- Keep responses concise and actionable for a job seeker.
- Salary ranges should be in USD unless otherwise implied by the industry name.
- Always return valid JSON with all 9 fields.`
        },
        {
          role: 'user',
          content: `Research the "${industry_name.trim()}" industry for a job seeker. Return a JSON object with exactly these fields:

{
  "key_trends": "2-4 current trends shaping this industry (bullet points separated by \\n)",
  "major_players": "Top 5-8 well-known companies in this space, comma separated",
  "growth_outlook": "One paragraph: is the industry growing, stable, or declining? Why?",
  "job_demand": "Which roles are most in demand? Are companies actively hiring?",
  "salary_ranges": "Typical salary ranges by seniority level (e.g., Entry $60K-80K, Mid $90K-130K, Senior $140K-180K)",
  "skills_needed": "Top 6-10 technical and soft skills required, comma separated",
  "pros": "3-5 reasons why working in this industry is attractive for a professional",
  "cons": "3-5 honest challenges or downsides of working in this industry",
  "notes": "Any important nuances a job seeker should know before targeting this industry"
}

Only include data you are confident is accurate as of your knowledge cutoff. Use "Not enough reliable information" for any field where you lack confidence.`
        }
      ]
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) throw new Error('Empty response from AI')

    const parsed = JSON.parse(raw)

    // Validate all required fields are present
    const fields = ['key_trends', 'major_players', 'growth_outlook', 'job_demand', 'salary_ranges', 'skills_needed', 'pros', 'cons', 'notes']
    const result = {}
    for (const field of fields) {
      result[field] = typeof parsed[field] === 'string' && parsed[field].trim() ? parsed[field].trim() : ''
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Industry autofill error:', error)
    res.status(500).json({ error: 'Failed to generate industry research. Please try again.' })
  }
})

export default router
