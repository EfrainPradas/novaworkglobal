import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WelcomeHero from '../components/home-dashboard/WelcomeHero'
import QuickActionCards from '../components/home-dashboard/QuickActionCards'
// TODO: Re-enable when ready
// import MemberSessionsSection from '../components/home-dashboard/MemberSessionsSection'
// import CommunityHighlights from '../components/home-dashboard/CommunityHighlights'
// import ResourcesFeed from '../components/home-dashboard/ResourcesFeed'
import RecentActivity from '../components/home-dashboard/RecentActivity'
import { SmartGuidedBanner, NextStepCard, SmartGuideWelcome } from '../components/guided-path'
import { useGuidedPath } from '../contexts/GuidedPathContext'
import { getDashboardOverview, getUserTier } from '../services/home-dashboard/dashboard.service'
import type { DashboardOverview, TierLevel } from '../types/home-dashboard'

interface DashboardOutletContext {
  user: any
  userProfile: any
  userName: string | null
  userLevel: TierLevel
  overview: DashboardOverview | null
  overviewLoading: boolean
}

export default function HomeDashboardIndex() {
  const context = useOutletContext<DashboardOutletContext>()
  const { user, userProfile, userName, userLevel, overview, overviewLoading } = context
  const [searchParams] = useSearchParams()
  const { enable, state, isLoading: guidedLoading } = useGuidedPath()
  const welcomeProcessedRef = useRef(false)

  // After successful payment, auto-activate Smart Guide so the user lands on a
  // dashboard with the guided banner + next-step card already visible, instead
  // of a dismissible welcome modal that many users skip.
  useEffect(() => {
    if (welcomeProcessedRef.current) return
    if (searchParams.get('welcome') !== 'true') return
    if (!user?.id) return
    if (guidedLoading) return

    welcomeProcessedRef.current = true

    const hasActive = state?.has_active_run && state?.run?.guidance_enabled
    if (!hasActive) {
      enable().catch(err => console.warn('[post-pay] Auto-enable Smart Guide failed:', err))
    }

    window.history.replaceState({}, '', '/dashboard')
  }, [searchParams, user?.id, enable, state, guidedLoading])

  return (
    <div className="px-5 py-4 space-y-6">
      {/* First-time Smart Guide welcome modal */}
      <SmartGuideWelcome userId={user?.id} />

      {/* Smart Guided Path Banner */}
      <SmartGuidedBanner />

      {/* Hero */}
      <WelcomeHero
        userName={userName}
        overview={overview}
        loading={overviewLoading}
      />

      {/* Quick Action Cards */}
      <QuickActionCards />

      {/* Next Best Action (Guided Path) */}
      <NextStepCard />

      {/* TODO: Re-enable when ready */}
      {/* {user && <MemberSessionsSection userId={user.id} />} */}
      {/* <CommunityHighlights userLevel={userLevel} /> */}
      {/* <ResourcesFeed userLevel={userLevel} /> */}

      {/* Recent Activity — disabled */}
      {/* {user && <RecentActivity userId={user.id} />} */}
    </div>
  )
}
