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

export default function LandingPageV2() {
    return (
        <div className="min-h-screen font-sans bg-white selection:bg-primary-100 selection:text-primary-900">
            <Navbar />

            <main>
                <HeroModern />
                <TrustSection />
                <ProblemSection />
                <DifferentiatorSection />
                <HowItWorksSection />
                <ProgramGrid />
                <PhilosophySection />
                <TestimonialsSection />
                <LandingPageCTA />
            </main>
            <Footer />
        </div>
    )
}
