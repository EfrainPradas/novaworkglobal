import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroModern from '../components/landing-v2/HeroModern'
import ProblemSection from '../components/landing/ProblemSection'
import ProgramCard from '../components/landing/ProgramCard'
import HowItWorksSection from '../components/HowItWorksSection'
import DifferentiatorSection from '../components/landing/DifferentiatorSection'
import TrustSection from '../components/landing/TrustSection'
import PricingSection from '../components/landing/PricingSection'
import AddOnSection from '../components/landing/AddOnSection'
import LandingPageCTA from '../components/landing/LandingPageCTA'
import LandingNavbar from '../components/layout/LandingNavbar'
import LandingFooter from '../components/layout/LandingFooter'
import {
  programCards,
  howItWorksSteps,
  novaNextPlans,
  addOnsConfig,
  defaultAddOnMode
} from '../config/landingContent'

export default function Landing() {
  const navigate = useNavigate()
  const [showTrialModal, setShowTrialModal] = useState(false)

  const handleStartTrial = () => {
    // Scroll to the programs selection section
    const programsSection = document.getElementById('programs')
    if (programsSection) {
      programsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-white relative">
      <LandingNavbar />

      {/* 1. Hero Section */}
      <HeroModern />

      {/* 2. Problem / Empathy Section */}
      <ProblemSection />

      {/* 3. Program Path Selection */}
      <section id="programs" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Choose Your Path
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Three proven programs designed for different career transition needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {programCards.map((program, idx) => (
              <ProgramCard
                key={program.id}
                {...program}
                variant={idx === 0 ? 'featured' : 'default'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <HowItWorksSection steps={howItWorksSteps} />

      {/* 5. Human + AI Differentiation */}
      <DifferentiatorSection />

      {/* 6. Credibility / Trust */}
      <TrustSection />

      {/* 7. NovaNext Pricing Section */}
      <PricingSection plans={novaNextPlans} />

      {/* 8. Add-Ons Section */}
      <AddOnSection addOns={addOnsConfig[defaultAddOnMode]} mode={defaultAddOnMode} />

      {/* 9. Final CTA Section */}
      {/* 9. Final CTA Section */}
      <LandingPageCTA onAction={handleStartTrial} />

      <LandingFooter />
    </div>
  )
}
