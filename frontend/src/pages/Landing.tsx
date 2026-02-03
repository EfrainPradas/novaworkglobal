/**
 * Landing Page - NovaWork Global
 * Main landing page with multi-language support
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Star, Crown, X, Check } from 'lucide-react'
import LanguageSelector from '../components/LanguageSelector'
import HowItWorksSection from '../components/HowItWorksSection'

export default function Landing() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [showTrialModal, setShowTrialModal] = useState(false)

  const handleStartTrial = () => {
    setShowTrialModal(true)
  }

  const selectTrialTier = (tier: 'basic' | 'pro' | 'executive') => {
    navigate(`/signup?trial=true&tier=${tier}`)
  }

  return (
    <div className="min-h-screen bg-white relative">
      {/* Trial Selection Modal */}
      {showTrialModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 md:p-8 relative animate-fade-in-up">
            <button
              onClick={() => setShowTrialModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-10">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">Choose your 7-Day Free Trial</h3>
              <p className="text-xl text-gray-600">Experience the full power of NovaWork Global risk-free</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Basic Tier */}
              <div className="border border-gray-100 rounded-xl p-4 hover:border-gray-400 hover:shadow-lg transition-all cursor-pointer group bg-gray-50/50"
                onClick={() => selectTrialTier('basic')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition-colors">
                    <Check className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Basic</h4>
                    <p className="text-gray-500 font-medium text-sm">Get Started</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-gray-400" /> 1 Resume
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-gray-400" /> 10 Applications
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-gray-400" /> Basic Matching
                  </li>
                </ul>
                <button className="w-full py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition-colors text-sm">
                  Select Basic
                </button>
              </div>

              {/* Pro Tier */}
              <div className="border-2 border-emerald-100 rounded-xl p-4 hover:border-emerald-500 hover:shadow-xl transition-all cursor-pointer group bg-emerald-50/30"
                onClick={() => selectTrialTier('pro')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Pro Plan</h4>
                    <p className="text-emerald-600 font-medium text-sm">Most Popular</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500" /> Unlimited Resumes
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500" /> AI Job Matching
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-emerald-500" /> 100 Applications
                  </li>
                </ul>
                <button className="w-full py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm">
                  Start Pro Trial
                </button>
              </div>

              {/* Executive Tier */}
              <div className="border-2 border-amber-100 rounded-xl p-4 hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer group bg-amber-50/30"
                onClick={() => selectTrialTier('executive')}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">Executive</h4>
                    <p className="text-amber-600 font-medium text-sm">Full Access</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6 text-sm">
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-amber-500" /> Everything in Pro
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-amber-500" /> Interview Mastery
                  </li>
                  <li className="flex items-center gap-2 text-gray-700">
                    <Check className="w-4 h-4 text-amber-500" /> Priority Support
                  </li>
                </ul>
                <button className="w-full py-2 bg-amber-600 text-white rounded-lg font-bold hover:bg-amber-700 transition-colors text-sm">
                  Start Exec Trial
                </button>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              No credit card required for trial. Cancel anytime.
            </p>
          </div>
        </div>
      )}

      {/* Header / Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/logo.png" alt="NovaWork Global" className="h-20 w-auto" />
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.features')}
              </a>
              <a href="#how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.howItWorks')}
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-600 transition-colors">
                {t('landing.nav.pricing')}
              </a>
            </div>

            {/* Language Selector & Auth Buttons */}
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={() => navigate('/signin')}
                className="text-gray-600 hover:text-primary-600 font-medium transition-colors"
              >
                {t('common.signIn')}
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
              >
                {t('common.getStarted')}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl font-heading font-bold text-gray-900 mb-6">
              {t('landing.hero.title')}{' '}
              <span className="text-primary-600">{t('landing.hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('landing.hero.subtitle')}
            </p>
            <p className="text-lg text-gray-500 mb-10">
              {t('landing.hero.description')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartTrial}
                className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
              >
                {t('landing.hero.startTrial')}
              </button>
              <button
                onClick={() => navigate('/signin')}
                className="bg-white text-primary border-2 border-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
              >
                {t('common.signIn')}
              </button>
            </div>

            {/* Social Proof */}
            <p className="mt-8 text-sm text-gray-500">
              {t('landing.hero.noCreditCard')}
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: ATS Resumes */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.atsResumes.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.atsResumes.description')}
              </p>
            </div>

            {/* Feature 2: Smart Matching */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.smartMatching.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.smartMatching.description')}
              </p>
            </div>

            {/* Feature 3: Auto Applications */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.autoApplications.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.autoApplications.description')}
              </p>
            </div>

            {/* Feature 4: Interview Prep */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.interviewPrep.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.interviewPrep.description')}
              </p>
            </div>

            {/* Feature 5: Analytics */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.analytics.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.analytics.description')}
              </p>
            </div>

            {/* Feature 6: Skill Dev */}
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('landing.features.skillDev.title')}
              </h3>
              <p className="text-gray-600">
                {t('landing.features.skillDev.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Modern Animated Version */}
      <div id="how-it-works">
        <HowItWorksSection />
      </div>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-heading font-bold text-gray-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('landing.pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('landing.pricing.basic.name')}
              </h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.basic.description')}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$29</span>
                <span className="text-gray-600">/{t('landing.pricing.monthly')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basic.feature1')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basic.feature2')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basic.feature3')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basic.feature4')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.basic.feature5')}</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('landing.pricing.choosePlan')}
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white p-8 rounded-xl shadow-xl border-2 border-primary-600 relative">
              <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 text-sm font-semibold rounded-bl-lg rounded-tr-lg">
                {t('landing.pricing.mostPopular')}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('landing.pricing.pro.name')}
              </h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.pro.description')}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">$79</span>
                <span className="text-gray-600">/{t('landing.pricing.monthly')}</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature1')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature2')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature3')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature4')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature5')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature6')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.pro.feature7')}</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t('landing.pricing.choosePlan')}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {t('landing.pricing.enterprise.name')}
              </h3>
              <p className="text-gray-600 mb-4">{t('landing.pricing.enterprise.description')}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">Custom</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature1')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature2')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature3')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature4')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature5')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature6')}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{t('landing.pricing.enterprise.feature7')}</span>
                </li>
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                {t('landing.pricing.contactUs')}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-heading font-bold text-white mb-4">
            {t('landing.cta.title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {t('landing.cta.subtitle')}
          </p>
          <button
            onClick={handleStartTrial}
            className="bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
          >
            {t('landing.cta.button')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-white text-xl font-bold mb-4">NovaWork Global</h3>
              <p className="text-gray-400">
                {t('landing.footer.tagline')}
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-white transition-colors">{t('landing.footer.productLinks.features')}</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">{t('landing.footer.productLinks.pricing')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.productLinks.testimonials')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.productLinks.roadmap')}</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.company')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.companyLinks.about')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.companyLinks.careers')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.companyLinks.blog')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.companyLinks.press')}</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.legal')}</h4>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.legalLinks.privacy')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.legalLinks.terms')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('landing.footer.legalLinks.cookie')}</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              {t('landing.footer.copyright')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
