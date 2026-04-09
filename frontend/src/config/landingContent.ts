/**
 * NovaWork Global Landing Page Content Configuration
 * Single source of truth for all landing page content, pricing, and add-ons
 */

export interface PricingPlan {
    name: string
    displayName: string
    monthly: number
    annual: number
    positioning: string
    features: string[]
    emailSupport: string
    liveSessions: string
    badge?: string
    cta?: string
}

export interface AddOn {
    id: string
    name: string
    description?: string
    pricing: {
        single?: number
        bundle_3?: number
        bundle_6?: number
        bundle_10?: number
    }
}

export type AddOnPricingMode = 'standard' | 'premium'

// Hero Section Content
export const heroContent = {
    headline: 'Ignite Your Next Career Chapter',
    subheadline: 'Clarity. Direction. Momentum.',
    supportingCopy: 'NovaWork Global helps professionals navigate career change with a proven system that blends 80+ years of human career coaching experience with intelligent AI tools, so you move forward with confidence, not confusion.',
    primaryCTA: 'Find Your Path',
    secondaryCTA: 'Sign In',
    trustLine: 'No credit card required • 7-day free trial'
}

// Header Navigation
export const headerNav = {
    logo: 'NovaWork Global',
    menuItems: [
        { label: 'Programs', href: '#programs' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Methodology', href: '#methodology' },
        { label: 'Insights', href: '#insights' }
    ],
    primaryCTA: 'Find Your Path →'
}

// Footer Content
export const footerContent = {
    programs: {
        title: 'Programs',
        links: [
            { label: 'NovaNext™', href: '/programs/novanext' },
            { label: 'NovaRearchitect™', href: '/programs/novarearchitect' },
            { label: 'NovaAlign™', href: '/programs/novaalign' }
        ]
    },
    company: {
        title: 'Company',
        links: [
            { label: 'About', href: '/about' },
            { label: 'Methodology', href: '/methodology' },
            { label: 'Insights', href: '/insights' }
        ]
    },
    legal: {
        title: 'Legal',
        links: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' }
        ]
    }
}

// Program Path Selection Cards
export const programCards = [
    {
        id: 'novanext',
        name: 'NovaNext™',
        tagline: 'For Your Next Step',
        description: 'Build your resume, clarify your lane, and start moving.',
        cta: 'Start NovaNext →',
        href: '/programs/novanext'
    },
    {
        id: 'novarearchitect',
        name: 'NovaRearchitect™',
        tagline: 'For a Full Reinvention',
        description: 'Complete career blueprint and employability transformation.',
        cta: 'Explore NovaRearchitect →',
        href: '/programs/novarearchitect'
    },
    {
        id: 'novaalign',
        name: 'NovaAlign™',
        tagline: 'For Finding Direction',
        description: 'Clarity on strengths and a plan for decisive action.',
        cta: 'Discover NovaAlign →',
        href: '/programs/novaalign'
    }
]

// How It Works Steps (Diagnose → Decide → Build → Execute)
export const howItWorksSteps = [
    {
        number: 1,
        title: 'Diagnose',
        description: 'Evaluate your current situation and identify where you are',
        icon: 'target' as const
    },
    {
        number: 2,
        title: 'Decide',
        description: 'Clarify your direction and choose the right path forward',
        icon: 'compass' as const
    },
    {
        number: 3,
        title: 'Build',
        description: 'Create your positioning, resume, and professional narrative',
        icon: 'wrench' as const
    },
    {
        number: 4,
        title: 'Execute',
        description: 'Launch your search and land interviews with confidence',
        icon: 'rocket' as const
    }
]

// NovaNext Pricing Plans
export const novaNextPlans: PricingPlan[] = [
    {
        name: 'esenciales',
        displayName: 'Essentials',
        monthly: 29,
        annual: 290,
        positioning: 'Build your base',
        features: [
            'Resume Builder',
            'Accomplishment Bank',
            'Professional Profile (AI)'
        ],
        emailSupport: 'Standard support',
        liveSessions: 'Not included',
        cta: 'Start Here'
    },
    {
        name: 'momentum',
        displayName: 'Momentum',
        monthly: 49,
        annual: 490,
        positioning: 'Active job search',
        features: [
            'Resume Builder',
            'Accomplishment Bank',
            'Professional Profile (AI)',
            'Job Application System'
        ],
        emailSupport: 'Standard support',
        liveSessions: 'Not included',
        badge: 'Most Popular',
        cta: 'Get Momentum'
    },
    {
        name: 'vanguard',
        displayName: 'Vanguard',
        monthly: 149,
        annual: 1490,
        positioning: "Don't navigate alone",
        features: [
            'Resume Builder',
            'Accomplishment Bank',
            'Professional Profile (AI)',
            'Job Application System',
            'Career Vision',
            'Interview Mastery',
            'Monthly Strategy Session',
            'Priority Support'
        ],
        emailSupport: 'Priority support',
        liveSessions: '1 monthly strategy session',
        badge: '⭐',
        cta: 'Go Vanguard'
    }
]

// Coaching Services
export interface CoachingService {
    id: string
    name: string
    price: string
    format: string
    bestFor: string
    valueLogic: string
    cta: string
    featured?: boolean
}

export const coachingServices: CoachingService[] = [
    {
        id: 'one-on-one-session',
        name: '1:1 Session',
        price: '$149 / session',
        format: '45-min live session',
        bestFor: 'Deep clarity & strategy',
        valueLogic: 'Premium, one-time',
        cta: 'Book Session'
    },
    {
        id: 'email-coaching',
        name: 'Email Coaching',
        price: '$39 / month',
        format: '3 emails/month',
        bestFor: 'Ongoing guidance',
        valueLogic: 'Lightweight support',
        cta: 'Get Email Support'
    },
    {
        id: 'coach-plus-email',
        name: 'Coach + Email',
        price: '$179 / month',
        format: '1 session + 3 emails/month',
        bestFor: 'Strategy + continuity',
        valueLogic: 'Discounted bundle',
        cta: 'Get Support',
        featured: true
    }
]

// Individual Module Pricing
export interface ModulePricing {
    id: string
    name: string
    monthly: number
    oneTime: number
}

export const modulePricing: ModulePricing[] = [
    { id: 'interview-mastery', name: 'Interview Mastery', monthly: 15, oneTime: 59 },
    { id: 'career-vision', name: 'Career Vision', monthly: 19, oneTime: 89 },
    { id: 'job-application-system', name: 'Job Application System', monthly: 19, oneTime: 89 }
]

// Maintenance Plan
export const maintenancePlan = {
    price: 9,
    includes: 'Accomplishment Bank + updates + light AI support',
    positioning: "Stay ready, even when you're not searching"
}
