import Navbar from '../components/layout/LandingNavbar'
import Footer from '../components/layout/LandingFooter'
import HeroModern from '../components/landing-v2/HeroModern'
import TrustSection from '../components/landing/TrustSection'
import ProblemSection from '../components/landing/ProblemSection'
import PhilosophySection from '../components/landing-v2/PhilosophySection'
import DifferentiatorSection from '../components/landing/DifferentiatorSection'
import HowItWorksSection from '../components/HowItWorksSection'
import ProgramGrid from '../components/landing-v2/ProgramGrid'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import LandingPageCTA from '../components/landing/LandingPageCTA'

const howItWorksSteps = [
    {
        number: 1,
        title: 'Diagnose',
        description: 'We analyze your career history, strengths, and market positioning to identify your unique value.',
        icon: 'target' as const
    },
    {
        number: 2,
        title: 'Decide',
        description: 'Define your ideal role, industry, and work preferences with clarity and confidence.',
        icon: 'compass' as const
    },
    {
        number: 3,
        title: 'Build',
        description: 'Craft a compelling resume, LinkedIn profile, and personal brand that opens doors.',
        icon: 'wrench' as const
    },
    {
        number: 4,
        title: 'Execute',
        description: 'Launch your job search with a strategic plan, interview prep, and ongoing coaching support.',
        icon: 'rocket' as const
    }
]

export default function LandingPageV2() {
    return (
        <div className="min-h-screen font-sans bg-white selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <main>
                <HeroModern />
                <TrustSection />
                <ProblemSection />
                <DifferentiatorSection />
                <HowItWorksSection steps={howItWorksSteps} />
                <ProgramGrid />
                <PhilosophySection />
                <TestimonialsSection />
                <LandingPageCTA />
            </main>
            <Footer />
        </div>
    )
}
