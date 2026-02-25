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
        name: 'essentials',
        displayName: 'NovaNext Essentials',
        monthly: 29,
        annual: 290,
        positioning: 'Build your resume, clarify your lane, and start moving.',
        features: [
            '12-month access',
            'Video training',
            'AI Resume Builder',
            'Templates & scripts',
            'Positioning basics'
        ],
        emailSupport: '3 replies/year',
        liveSessions: 'Not included (paid add-on)'
    },
    {
        name: 'momentum',
        displayName: 'NovaNext Momentum',
        monthly: 59,
        annual: 590,
        positioning: 'Everything in Essentials plus accelerated job search tools.',
        features: [
            'Everything in Essentials',
            'ATS optimization',
            'LinkedIn rebuild',
            'Proof Library',
            'Search Kit',
            '2-week activation plan'
        ],
        emailSupport: '1 reply every 2 months (6/year)',
        liveSessions: 'Not included (paid add-on)',
        badge: 'Most Popular'
    },
    {
        name: 'executive',
        displayName: 'NovaNext Executive',
        monthly: 199,
        annual: 1990,
        positioning: 'Everything in Momentum plus executive-level positioning and live support.',
        features: [
            'Everything in Momentum',
            'Executive positioning',
            'Interview conversion',
            'Negotiation scripts',
            'Priority access to extra sessions'
        ],
        emailSupport: '1 reply/month (12/year)',
        liveSessions: '1 x 45-min session every 2 months (6/year)'
    }
]

// Add-Ons Configuration
export const addOnsConfig: Record<AddOnPricingMode, AddOn[]> = {
    standard: [
        {
            id: 'standard_session_45m',
            name: 'Standard 1:1 Session (45 min)',
            pricing: {
                single: 199,
                bundle_3: 549,
                bundle_6: 999,
                bundle_10: 1590
            }
        },
        {
            id: 'executive_advisory_45m',
            name: 'Executive Advisory (45 min)',
            pricing: {
                single: 299,
                bundle_3: 849,
                bundle_6: 1599,
                bundle_10: 2490
            }
        },
        {
            id: 'offer_review_counteroffer',
            name: 'Offer Review & Counteroffer Prep',
            description: 'Recommended for Essentials & Momentum (Included in Executive)',
            pricing: {
                single: 349
            }
        }
    ],
    premium: [
        {
            id: 'strategy_session_45m',
            name: 'Strategy Session (45 min)',
            pricing: {
                single: 249,
                bundle_3: 699,
                bundle_6: 1299,
                bundle_10: 1999
            }
        },
        {
            id: 'linkedin_review_async',
            name: 'LinkedIn Review (Async)',
            pricing: {
                single: 299
            }
        },
        {
            id: 'offer_review_counteroffer',
            name: 'Offer Review & Counteroffer Prep',
            description: 'Recommended for Essentials & Momentum (Included in Executive)',
            pricing: {
                single: 349
            }
        }
    ]
}

// Default add-on mode (can be changed via config/admin panel later)
export const defaultAddOnMode: AddOnPricingMode = 'standard'
