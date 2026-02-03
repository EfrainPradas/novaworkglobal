/**
 * OpenAI Service
 * Handles AI-powered suggestions for Career Vision
 */

import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY
})

/**
 * Generate Career Vision suggestions based on user context
 * @param {Object} context - User context information
 * @param {string} context.target_role - Target job role
 * @param {string} context.industry - Industry
 * @param {number} context.years_experience - Years of experience
 * @param {string[]} context.current_skills - Current skills
 * @param {string[]} context.current_values - Current values
 * @param {string[]} context.current_interests - Current interests
 * @returns {Promise<Object>} Suggestions object with skills, values, and interests arrays
 */
export async function generateCareerVisionSuggestions(context) {
  try {
    console.log('🤖 Generating AI Career Vision suggestions...')
    console.log('Context:', JSON.stringify(context, null, 2))

    const {
      target_role = 'professional',
      industry = 'general',
      years_experience = 0,
      current_skills = [],
      current_values = [],
      current_interests = []
    } = context

    // Build the prompt
    const prompt = buildSuggestionsPrompt(
      target_role,
      industry,
      years_experience,
      current_skills,
      current_values,
      current_interests
    )

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a career counselor helping users discover their ideal career path. You provide thoughtful, personalized suggestions for skills, values, and interests based on their background and goals.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    console.log('✅ AI Response received')
    console.log('Raw response:', content)

    // Parse the JSON response
    const suggestions = JSON.parse(content)

    // Validate and structure response
    const result = {
      skills: Array.isArray(suggestions.skills) ? suggestions.skills : [],
      values: Array.isArray(suggestions.values) ? suggestions.values : [],
      interests: Array.isArray(suggestions.interests) ? suggestions.interests : []
    }

    console.log('✅ Suggestions generated:', result)
    return result

  } catch (error) {
    console.error('❌ Error generating AI suggestions:', error)

    // Return fallback suggestions
    console.log('⚠️  Returning fallback suggestions')
    return getFallbackSuggestions(context.target_role, context.industry)
  }
}

/**
 * Build the prompt for AI suggestions
 */
function buildSuggestionsPrompt(
  targetRole,
  industry,
  yearsExperience,
  currentSkills,
  currentValues,
  currentInterests
) {
  const experienceLevel = yearsExperience < 2 ? 'early career' :
                         yearsExperience < 5 ? 'mid-level' :
                         yearsExperience < 10 ? 'experienced' :
                         'senior/expert'

  let prompt = `I'm a career counselor helping a ${experienceLevel} professional`

  if (targetRole && targetRole !== 'professional') {
    prompt += ` targeting a role as "${targetRole}"`
  }

  if (industry && industry !== 'general') {
    prompt += ` in the ${industry} industry`
  }

  prompt += '.\n\n'

  // Add current items if any
  if (currentSkills.length > 0) {
    prompt += `They've already identified these skills: ${currentSkills.join(', ')}.\n`
  }

  if (currentValues.length > 0) {
    prompt += `They've already identified these values: ${currentValues.join(', ')}.\n`
  }

  if (currentInterests.length > 0) {
    prompt += `They've already identified these interests: ${currentInterests.join(', ')}.\n`
  }

  prompt += `\nPlease suggest 5-7 additional items for each category that would complement what they've identified and help them discover their ideal career path. Focus on:

1. **Skills & Knowledge**: Technical skills, soft skills, or knowledge areas relevant to their target role and industry
2. **Core Values**: Professional values and principles that guide career decisions
3. **Interests & Passions**: Areas of genuine interest that could inform career direction

Requirements:
- Suggestions should be specific and actionable
- Avoid duplicating what they've already listed
- Make suggestions relevant to their experience level (${experienceLevel})
- Consider their target role${targetRole !== 'professional' ? ` (${targetRole})` : ''} and industry${industry !== 'general' ? ` (${industry})` : ''}
- Keep each suggestion concise (2-4 words)
- Return EXACTLY in this JSON format:

{
  "skills": ["skill 1", "skill 2", "skill 3", "skill 4", "skill 5"],
  "values": ["value 1", "value 2", "value 3", "value 4", "value 5"],
  "interests": ["interest 1", "interest 2", "interest 3", "interest 4", "interest 5"]
}`

  return prompt
}

/**
 * Get fallback suggestions when AI fails
 */
function getFallbackSuggestions(targetRole, industry) {
  // Generic suggestions by role/industry
  const suggestions = {
    skills: [
      'Problem Solving',
      'Communication',
      'Leadership',
      'Strategic Thinking',
      'Data Analysis',
      'Time Management',
      'Adaptability'
    ],
    values: [
      'Integrity',
      'Innovation',
      'Collaboration',
      'Excellence',
      'Growth',
      'Work-Life Balance',
      'Continuous Learning'
    ],
    interests: [
      'Technology',
      'Learning New Skills',
      'Mentoring Others',
      'Process Improvement',
      'Creative Problem Solving',
      'Industry Trends',
      'Professional Development'
    ]
  }

  // Industry-specific adjustments
  if (industry && industry.toLowerCase().includes('tech')) {
    suggestions.skills.unshift('Cloud Computing', 'Agile Methodologies')
    suggestions.interests.unshift('Emerging Technologies', 'Open Source')
  } else if (industry && industry.toLowerCase().includes('finance')) {
    suggestions.skills.unshift('Financial Analysis', 'Risk Management')
    suggestions.interests.unshift('Market Analysis', 'Economic Trends')
  } else if (industry && industry.toLowerCase().includes('health')) {
    suggestions.skills.unshift('Patient Care', 'Healthcare Regulations')
    suggestions.interests.unshift('Medical Research', 'Patient Advocacy')
  }

  // Return first 5-7 of each
  return {
    skills: suggestions.skills.slice(0, 7),
    values: suggestions.values.slice(0, 7),
    interests: suggestions.interests.slice(0, 7)
  }
}

/**
 * Generate Career Vision statement based on user's profile
 * @param {Object} profile - Career vision profile
 * @returns {Promise<string>} Generated career vision statement
 */
export async function generateCareerVisionStatement(profile) {
  try {
    console.log('🤖 Generating Career Vision statement...')

    const {
      skills_knowledge = [],
      core_values = [],
      interests = []
    } = profile

    const prompt = `Based on this career profile, create a personalized career vision statement (2-3 sentences):

Skills & Knowledge: ${skills_knowledge.join(', ')}
Core Values: ${core_values.join(', ')}
Interests & Passions: ${interests.join(', ')}

The career vision statement should:
- Synthesize how their skills, values, and interests align
- Be aspirational yet realistic
- Be written in first person
- Be 2-3 sentences maximum
- Focus on their ideal career direction

Format the response as JSON with a single "statement" field.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a career counselor who creates inspiring, personalized career vision statements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    const result = JSON.parse(content)

    console.log('✅ Career vision statement generated')
    return result.statement || 'Unable to generate statement'

  } catch (error) {
    console.error('❌ Error generating career vision statement:', error)
    return null
  }
}

/**
 * Analyze job history to identify career satisfiers and dissatisfiers
 * @param {Array} jobs - Array of job history entries
 * @returns {Promise<Object>} Insights object with satisfiers, dissatisfiers, patterns, and recommendations
 */
export async function analyzeJobHistory(jobs) {
  try {
    console.log('🤖 Analyzing job history for patterns...')

    if (jobs.length < 2) {
      throw new Error('Need at least 2 jobs to analyze')
    }

    // Build analysis prompt
    const prompt = buildJobHistoryPrompt(jobs)

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a career analyst who identifies patterns in job history to help people understand what makes them satisfied or dissatisfied in their careers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    const insights = JSON.parse(content)

    console.log('✅ Job history analysis completed')
    return {
      satisfiers: insights.satisfiers || [],
      dissatisfiers: insights.dissatisfiers || [],
      patterns: insights.patterns || '',
      recommendations: insights.recommendations || ''
    }

  } catch (error) {
    console.error('❌ Error analyzing job history:', error)
    throw error
  }
}

/**
 * Build prompt for job history analysis
 */
function buildJobHistoryPrompt(jobs) {
  let prompt = `Analyze this person's job history to identify patterns in their career satisfaction.\n\nJobs (from most recent to oldest):\n\n`

  jobs.forEach((job, index) => {
    prompt += `Job ${index + 1}: ${job.job_title} at ${job.company_name} (${job.duration})\n`

    if (job.company_liked || job.company_disliked) {
      prompt += `Company:\n`
      if (job.company_liked) prompt += `- Liked: ${job.company_liked} (${job.company_liked_why})\n`
      if (job.company_disliked) prompt += `- Disliked: ${job.company_disliked} (${job.company_disliked_why})\n`
    }

    if (job.position_liked || job.position_disliked) {
      prompt += `Position:\n`
      if (job.position_liked) prompt += `- Liked: ${job.position_liked} (${job.position_liked_why})\n`
      if (job.position_disliked) prompt += `- Disliked: ${job.position_disliked} (${job.position_disliked_why})\n`
    }

    if (job.manager_liked || job.manager_disliked) {
      prompt += `Manager:\n`
      if (job.manager_liked) prompt += `- Liked: ${job.manager_liked} (${job.manager_liked_why})\n`
      if (job.manager_disliked) prompt += `- Disliked: ${job.manager_disliked} (${job.manager_disliked_why})\n`
    }

    prompt += `\n`
  })

  prompt += `\nBased on this job history, provide:

1. **Satisfiers**: 5-7 specific things that consistently lead to career satisfaction for this person
2. **Dissatisfiers**: 5-7 specific things that consistently lead to career dissatisfaction
3. **Patterns**: A concise summary (2-3 sentences) of the overall patterns you observe
4. **Recommendations**: Specific, actionable advice (2-3 sentences) for what to look for in their next role

Return your analysis in this JSON format:
{
  "satisfiers": ["item 1", "item 2", ...],
  "dissatisfiers": ["item 1", "item 2", ...],
  "patterns": "Your pattern summary here",
  "recommendations": "Your recommendations here"
}

Focus on recurring themes and be specific. Don't just list what they said - synthesize insights about what truly matters to them.`

  return prompt
}

/**
 * Generate AI-powered accomplishments from PAR story data
 * @param {Object} data - PAR story data
 * @param {string} data.challenge - Problem or challenge
 * @param {string} data.result - Result achieved
 * @param {string} data.role_company - Role and company context
 * @param {Array} data.skills - User skills from Career Vision
 * @param {Array} data.competencies - Selected competencies
 * @returns {Promise<Array>} Array of 3 accomplishment statements
 */
export async function generateAccomplishments(data) {
  try {
    console.log('🤖 Generating AI accomplishments...')
    console.log('Input data:', JSON.stringify(data, null, 2))

    const {
      challenge = '',
      result = '',
      role_company = '',
      skills = [],
      competencies = []
    } = data

    // Build the prompt
    const prompt = buildAccomplishmentsPrompt(
      challenge,
      result,
      role_company,
      skills,
      competencies
    )

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and resume writer who specializes in creating powerful, accomplishment-focused statements that showcase quantifiable impact and professional achievements.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0].message.content
    console.log('✅ AI Response received')
    console.log('Raw response:', content)

    // Parse the JSON response
    const parsed = JSON.parse(content)

    // Validate and structure response
    const accomplishments = Array.isArray(parsed.accomplishments)
      ? parsed.accomplishments
      : Array.isArray(parsed.accomplishment)
        ? parsed.accomplishment
        : []

    console.log('✅ Accomplishments generated:', accomplishments)
    return accomplishments

  } catch (error) {
    console.error('❌ Error generating accomplishments:', error)

    // Return fallback accomplishments
    console.log('⚠️  Returning fallback accomplishments')
    return getFallbackAccomplishments(data.result, data.role_company)
  }
}

/**
 * Build the prompt for AI accomplishments generation
 */
function buildAccomplishmentsPrompt(challenge, result, roleCompany, skills, competencies) {
  let prompt = `Generate 3 powerful accomplishment statements based on the following PAR (Problem-Action-Result) story data:\n\n`

  prompt += `**Role/Company Context**: ${roleCompany || 'Not specified'}\n`
  prompt += `**Problem/Challenge**: ${challenge || 'Not specified'}\n`
  prompt += `**Result Achieved**: ${result || 'Not specified'}\n`

  if (skills && skills.length > 0) {
    prompt += `**User's Skills**: ${skills.join(', ')}\n`
  }

  if (competencies && competencies.length > 0) {
    prompt += `**Target Competencies**: ${competencies.join(', ')}\n`
  }

  prompt += `\nRequirements:
1. Create exactly 3 accomplishment statements that highlight the impact and results
2. Each accomplishment should be 1-2 sentences maximum
3. Include quantifiable metrics (percentages, numbers, timeframes) where possible
4. Use action verbs and focus on business impact
5. Incorporate relevant skills and competencies naturally
6. Make each accomplishment unique and highlight different aspects
7. Follow the STAR method (Situation, Task, Action, Result) in condensed form

Format your response as JSON with an "accomplishments" array containing exactly 3 strings.

Example format:
{
  "accomplishments": [
    "Led cross-functional team to increase user engagement by 45% through UX improvements and A/B testing",
    "Reduced operational costs by $250K annually by implementing automated workflow solutions",
    "Mentored 5 junior developers while delivering critical project 2 weeks ahead of schedule"
  ]
}`

  return prompt
}

/**
 * Get fallback accomplishments when AI fails
 */
function getFallbackAccomplishments(result, roleCompany) {
  const fallbacks = [
    "Successfully delivered measurable business impact through strategic execution and problem-solving",
    "Demonstrated leadership and technical expertise to achieve exceptional project outcomes",
    "Collaborated effectively with stakeholders to drive positive change and achieve organizational goals"
  ]

  // Try to incorporate some context from the input
  if (result && result.toLowerCase().includes('increase')) {
    fallbacks[0] = "Successfully increased key performance metrics through strategic initiatives and data-driven decision making"
  }

  if (result && result.toLowerCase().includes('reduce') || result && result.toLowerCase().includes('decrease')) {
    fallbacks[1] = "Efficiently reduced costs and optimized processes while maintaining high quality standards"
  }

  return fallbacks
}

export default {
  generateCareerVisionSuggestions,
  generateCareerVisionStatement,
  analyzeJobHistory,
  generateAccomplishments
}
