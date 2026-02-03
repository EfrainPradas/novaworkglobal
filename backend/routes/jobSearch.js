import express from 'express'
import axios from 'axios'
import { OpenAI } from 'openai'

const router = express.Router()

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
        allJobs.push(...jobs)
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

        try {
          // Use AI to calculate match score
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
- Description: ${job.description?.slice(0, 500)}...
- Location: ${job.location}
- Highlights: ${JSON.stringify(job.job_highlights || {})}

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
  "potential_concerns": ["list of potential concerns"]
}
`

          const aiResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: analysisPrompt }],
            max_tokens: 200,
            temperature: 0.1
          })

          const aiAnalysis = JSON.parse(aiResponse.choices[0].message.content)
          aiScore = aiAnalysis.score || 50

          return {
            id: job.job_id || `job-${Math.random()}`,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description,
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
            searchQuery: query,
            recommendedAt: new Date().toISOString(),

            // Original data
            highlights: job.job_highlights || [],
            thumbnail: job.thumbnail || null
          }

        } catch (aiError) {
          console.warn(`⚠️ AI analysis failed for job: ${job.title} - ${aiError.message}`)

          // Fallback to basic scoring
          return {
            id: job.job_id || `job-${Math.random()}`,
            title: job.title,
            company: job.company_name,
            location: job.location,
            description: job.description,
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

export default router
