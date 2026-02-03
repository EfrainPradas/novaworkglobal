// Salary estimation service
// This provides realistic salary ranges based on role, location, and level

export interface SalaryEstimate {
    min: number
    max: number
    median: number
    currency: string
    source: string
    location: string
    level: 'entry' | 'mid' | 'senior'
}

// Base salary data by role (in USD, adjusted for mid-level, US market)
const BASE_SALARIES: Record<string, { min: number; max: number; median: number }> = {
    // Tech & Engineering
    'software engineer': { min: 80000, max: 160000, median: 120000 },
    'data analyst': { min: 60000, max: 110000, median: 85000 },
    'data scientist': { min: 95000, max: 170000, median: 130000 },
    'product manager': { min: 90000, max: 170000, median: 130000 },
    'ux designer': { min: 70000, max: 130000, median: 95000 },
    'devops engineer': { min: 85000, max: 155000, median: 120000 },
    'frontend developer': { min: 70000, max: 140000, median: 105000 },
    'backend developer': { min: 75000, max: 145000, median: 110000 },
    'full stack developer': { min: 80000, max: 150000, median: 115000 },
    'machine learning engineer': { min: 100000, max: 180000, median: 140000 },

    // Business & Management
    'business analyst': { min: 60000, max: 105000, median: 80000 },
    'project manager': { min: 70000, max: 130000, median: 95000 },
    'marketing manager': { min: 65000, max: 125000, median: 90000 },
    'sales manager': { min: 70000, max: 140000, median: 100000 },
    'operations manager': { min: 65000, max: 120000, median: 90000 },
    'hr manager': { min: 60000, max: 115000, median: 85000 },

    // Finance & Accounting
    'financial analyst': { min: 60000, max: 110000, median: 80000 },
    'accountant': { min: 50000, max: 90000, median: 65000 },
    'controller': { min: 80000, max: 150000, median: 110000 },

    // Design & Creative
    'graphic designer': { min: 45000, max: 85000, median: 60000 },
    'ui designer': { min: 60000, max: 115000, median: 85000 },
    'content writer': { min: 40000, max: 75000, median: 55000 },

    // Healthcare
    'nurse': { min: 55000, max: 95000, median: 70000 },
    'physician': { min: 150000, max: 350000, median: 220000 },

    // Default/Generic
    'default': { min: 50000, max: 90000, median: 65000 }
}

// Location multipliers (relative to US average)
const LOCATION_MULTIPLIERS: Record<string, number> = {
    // US Major Tech Hubs
    'san francisco': 1.35,
    'new york': 1.25,
    'seattle': 1.20,
    'boston': 1.18,
    'austin': 1.10,
    'denver': 1.05,

    // US Other Cities
    'chicago': 1.08,
    'atlanta': 1.00,
    'dallas': 1.02,
    'miami': 0.95,
    'phoenix': 0.95,

    // International (rough estimates)
    'london': 0.85,
    'toronto': 0.80,
    'berlin': 0.75,
    'singapore': 0.90,
    'sydney': 0.85,
    'mumbai': 0.30,
    'mexico city': 0.40,

    // Remote/Default
    'remote': 1.00,
    'default': 1.00
}

// Experience level multipliers
const LEVEL_MULTIPLIERS = {
    entry: 0.70,
    mid: 1.00,
    senior: 1.40
}

/**
 * Normalize job title for matching
 */
function normalizeJobTitle(title: string): string {
    const normalized = title.toLowerCase().trim()

    // Map common variations to standard titles
    const mappings: Record<string, string> = {
        // Tech variations
        'swe': 'software engineer',
        'sde': 'software engineer',
        'software dev': 'software engineer',
        'software developer': 'software engineer',
        'web developer': 'full stack developer',
        'web dev': 'full stack developer',
        'frontend dev': 'frontend developer',
        'front end developer': 'frontend developer',
        'front-end developer': 'frontend developer',
        'backend dev': 'backend developer',
        'back end developer': 'backend developer',
        'back-end developer': 'backend developer',
        'fullstack': 'full stack developer',
        'full-stack developer': 'full stack developer',
        'data analysis': 'data analyst',
        'business process analyst': 'business analyst',
        'pm': 'product manager',
        'product owner': 'product manager',
        'scrum master': 'project manager',
        'ux/ui designer': 'ux designer',
        'ui/ux designer': 'ux designer',
        'ml engineer': 'machine learning engineer',
        'ai engineer': 'machine learning engineer',
        'devops': 'devops engineer',
        'site reliability engineer': 'devops engineer',
        'sre': 'devops engineer',

        // Business variations
        'ba': 'business analyst',
        'analyst': 'business analyst',
        'operations': 'operations manager',
        'ops manager': 'operations manager',
        'hr': 'hr manager',
        'human resources': 'hr manager',
        'marketing': 'marketing manager',
        'sales': 'sales manager',

        // Finance variations
        'finance': 'financial analyst',
        'accounting': 'accountant',
        'cpa': 'accountant',

        // Design variations
        'designer': 'ux designer',
        'visual designer': 'graphic designer',
        'content creator': 'content writer',
        'copywriter': 'content writer',
    }

    // Check for exact mappings first
    if (mappings[normalized]) {
        return mappings[normalized]
    }

    // Check if normalized contains any base salary key (exact match)
    for (const key of Object.keys(BASE_SALARIES)) {
        if (key !== 'default' && normalized.includes(key)) {
            return key
        }
    }

    // Check for partial matches in mappings
    for (const [pattern, replacement] of Object.entries(mappings)) {
        if (normalized.includes(pattern)) {
            return replacement
        }
    }

    // Broader category matching
    if (normalized.includes('engineer') || normalized.includes('developer')) {
        return 'software engineer'
    }
    if (normalized.includes('analyst')) {
        return 'business analyst'
    }
    if (normalized.includes('manager')) {
        return 'project manager'
    }
    if (normalized.includes('designer')) {
        return 'ux designer'
    }
    if (normalized.includes('data')) {
        return 'data analyst'
    }
    if (normalized.includes('product')) {
        return 'product manager'
    }
    if (normalized.includes('marketing') || normalized.includes('growth')) {
        return 'marketing manager'
    }
    if (normalized.includes('sales') || normalized.includes('account executive')) {
        return 'sales manager'
    }
    if (normalized.includes('hr') || normalized.includes('human') || normalized.includes('people')) {
        return 'hr manager'
    }
    if (normalized.includes('finance') || normalized.includes('financial')) {
        return 'financial analyst'
    }

    console.log(`[SalaryEstimation] No match found for job title: "${title}", using default salary`)
    return 'default'
}

/**
 * Normalize location for matching
 */
function normalizeLocation(location: string): string {
    const normalized = location.toLowerCase().trim()

    // Extract city if in "City, State" or "City, Country" format
    const parts = normalized.split(',')
    const city = parts[0].trim()

    // Check if city exists in multipliers
    if (LOCATION_MULTIPLIERS[city]) {
        return city
    }

    // Check if full location exists
    if (LOCATION_MULTIPLIERS[normalized]) {
        return normalized
    }

    return 'default'
}

/**
 * Estimate salary based on role, location, and experience level
 */
export function estimateSalary(
    jobTitle: string,
    location: string = 'remote',
    level: 'entry' | 'mid' | 'senior' = 'mid'
): SalaryEstimate {
    // Normalize inputs
    const normalizedTitle = normalizeJobTitle(jobTitle)
    const normalizedLocation = normalizeLocation(location)

    // Get base salary
    const baseSalary = BASE_SALARIES[normalizedTitle] || BASE_SALARIES.default

    // Get multipliers
    const locationMultiplier = LOCATION_MULTIPLIERS[normalizedLocation] || LOCATION_MULTIPLIERS.default
    const levelMultiplier = LEVEL_MULTIPLIERS[level]

    // Calculate adjusted salary
    const totalMultiplier = locationMultiplier * levelMultiplier

    const adjustedSalary = {
        min: Math.round(baseSalary.min * totalMultiplier),
        max: Math.round(baseSalary.max * totalMultiplier),
        median: Math.round(baseSalary.median * totalMultiplier)
    }

    return {
        ...adjustedSalary,
        currency: 'USD',
        source: 'Market data analysis',
        location: normalizedLocation === 'default' ? location : normalizedLocation,
        level
    }
}

/**
 * Generate salary estimates for alternative career paths
 */
export function generateCareerPathSalaries(
    primaryRole: string,
    location: string,
    skills: string[]
): Array<{ role: string; salary: SalaryEstimate }> {
    const paths: Array<{ role: string; salary: SalaryEstimate }> = []

    // Add primary role
    paths.push({
        role: primaryRole,
        salary: estimateSalary(primaryRole, location, 'mid')
    })

    // Suggest alternative roles based on skills
    const skillBasedSuggestions = getSkillBasedSuggestions(skills)

    skillBasedSuggestions.forEach(role => {
        if (role.toLowerCase() !== primaryRole.toLowerCase()) {
            paths.push({
                role,
                salary: estimateSalary(role, location, 'mid')
            })
        }
    })

    return paths.slice(0, 3) // Return top 3
}

/**
 * Get role suggestions based on skills
 */
function getSkillBasedSuggestions(skills: string[]): string[] {
    const suggestions: string[] = []
    const skillsLower = skills.map(s => s.toLowerCase())

    // Tech skills -> Tech roles
    if (skillsLower.some(s => ['python', 'javascript', 'java', 'c++'].includes(s))) {
        suggestions.push('Software Engineer')
    }

    if (skillsLower.some(s => ['data analysis', 'sql', 'excel', 'tableau'].includes(s))) {
        suggestions.push('Data Analyst')
    }

    if (skillsLower.some(s => ['machine learning', 'deep learning', 'ai'].includes(s))) {
        suggestions.push('Data Scientist')
    }

    // Business skills -> Business roles
    if (skillsLower.some(s => ['project management', 'agile', 'scrum'].includes(s))) {
        suggestions.push('Project Manager')
    }

    if (skillsLower.some(s => ['marketing', 'seo', 'content'].includes(s))) {
        suggestions.push('Marketing Manager')
    }

    // Design skills -> Design roles
    if (skillsLower.some(s => ['figma', 'sketch', 'ux', 'ui'].includes(s))) {
        suggestions.push('UX Designer')
    }

    // Default suggestions if no match
    if (suggestions.length === 0) {
        suggestions.push('Business Analyst', 'Project Manager')
    }

    return suggestions
}
