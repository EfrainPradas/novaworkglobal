/**
 * Ascendia Landing Page Content Configuration
 * Single source of truth for navigation, footer, and structural config.
 * All visible text is driven by i18n (en.json / es.json).
 */

export interface PricingPlan {
    name: string
    displayName: string
    monthly: number | null
    annual: number | null
    positioning: string
    features: string[]
    emailSupport: string
    liveSessions: string
    badge?: string
    cta?: string
    priceTBD?: boolean
    ctaDisabled?: boolean
    image?: string
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

// Header Navigation (labels are i18n keys: nav.menu.programs, etc.)
export const headerNav = {
    logo: 'Ascendia',
    menuItems: [
        { label: 'Programs', href: '#programs' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Why Ascendia', href: '#methodology' },
        { label: 'Insights', href: '#insights' }
    ],
    primaryCTA: 'Find Your Path →'
}

// Footer Content
export const footerContent = {
    programs: {
        title: 'Programs',
        links: [
            { label: 'NovaNext', href: '/programs/novanext' },
            { label: 'NovaRearchitect', href: '/programs/novarearchitect' },
            { label: 'NovaAlign', href: '/programs/novaalign' }
        ]
    },
    company: {
        title: 'Company',
        links: [
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

// Program Path Selection Cards (display text comes from i18n)
export const programCards = [
    {
        id: 'novanext',
        href: '/programs/novanext'
    },
    {
        id: 'novarearchitect',
        href: '/programs/novarearchitect'
    },
    {
        id: 'novaalign',
        href: '/programs/novaalign'
    }
]

// Ascendia Pricing Plans
export const ascendiaPlans: PricingPlan[] = [
    {
        name: 'core',
        displayName: 'Ascendia Core',
        image: '/images/Core.png',
        monthly: 0,
        annual: 0,
        positioning: 'Start building your professional foundation for free',
        features: [
            'Account creation',
            'Basic profile setup',
            'Limited Career Clarity',
            'Resume Studio preview',
            'Opportunity Hub preview',
            'Interview Prep preview',
            'Basic Smart Guide'
        ],
        emailSupport: 'Community',
        liveSessions: 'Not included',
        cta: 'Get Started Free'
    },
    {
        name: 'advance',
        displayName: 'Ascendia Advance',
        image: '/images/Advance.png',
        monthly: 10,
        annual: 100,
        positioning: 'Move forward with structure, strategy, and smarter career tools',
        features: [
            'Everything in Ascendia Core',
            'Full Resume Studio',
            'Resume export and download',
            'Multiple resume versions',
            'Opportunity Hub',
            'Application tracking',
            'Smart Matches',
            'Basic Interview Prep',
            'Enhanced recommendations'
        ],
        emailSupport: 'Email support',
        liveSessions: 'Not included',
        badge: 'Most Popular',
        cta: 'Get Started'
    },
    {
        name: 'apex',
        displayName: 'Ascendia Apex',
        image: '/images/Apex.png',
        monthly: 20,
        annual: 200,
        positioning: 'Advanced strategy for high-impact career moves',
        features: [
            'Everything in Ascendia Advance',
            'Advanced Interview Prep',
            'My Coaches',
            'Executive positioning support',
            'Priority support',
            'Advanced career strategy resources',
            'Premium guidance and review workflows'
        ],
        emailSupport: 'Priority support',
        liveSessions: '1 monthly strategy session',
        badge: 'Premium',
        cta: 'Get Started'
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

// Backward compatibility alias
export const novaNextPlans = ascendiaPlans
