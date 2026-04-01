import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WelcomeHero from '../components/home-dashboard/WelcomeHero'
import QuickActionCards from '../components/home-dashboard/QuickActionCards'
import MemberSessionsSection from '../components/home-dashboard/MemberSessionsSection'
import CommunityHighlights from '../components/home-dashboard/CommunityHighlights'
import ResourcesFeed from '../components/home-dashboard/ResourcesFeed'
import RecentActivity from '../components/home-dashboard/RecentActivity'
import { SmartGuidedBanner, NextStepCard, SmartGuideWelcome } from '../components/guided-path'
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

      {/* Member Sessions */}
      {user && <MemberSessionsSection userId={user.id} />}

      {/* Community */}
      <CommunityHighlights userLevel={userLevel} />

      {/* Resources */}
      <ResourcesFeed userLevel={userLevel} />

      {/* Recent Activity */}
      {user && <RecentActivity userId={user.id} />}
    </div>
  )
}
