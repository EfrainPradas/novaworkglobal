import Navbar from '../components/layout/LandingNavbar'
import Footer from '../components/layout/LandingFooter'
import HeroDashboard from '../components/landing/HeroDashboard'
import TrustSection from '../components/landing/TrustSection'
import MethodSection from '../components/landing/MethodSection'
import ProblemSection from '../components/landing/ProblemSection'
import DifferentiatorSection from '../components/landing/DifferentiatorSection'
import HowItWorksSection from '../components/HowItWorksSection'
import TestimonialsSection from '../components/landing/TestimonialsSection'
import MembershipSection from '../components/landing/MembershipSection'
import FAQSection from '../components/landing/FAQSection'
import LandingPageCTA from '../components/landing/LandingPageCTA'

export default function LandingPageV2() {
    return (
        <div className="min-h-[100dvh] font-sans bg-[var(--ascendia-surface)] selection:bg-[var(--ascendia-accent)] selection:text-[var(--ascendia-primary)] overflow-x-hidden">
            <Navbar />

            <main>
                <HeroDashboard />
                <TrustSection />
                <MethodSection />
                <ProblemSection />
                <DifferentiatorSection />
                <HowItWorksSection />
                <TestimonialsSection />
                <MembershipSection />
                <FAQSection />
                <LandingPageCTA />
            </main>
            <Footer />
        </div>
    )
}