import { useOutletContext } from 'react-router-dom'
import WelcomeHero from '../components/home-dashboard/WelcomeHero'
import QuickActionCards from '../components/home-dashboard/QuickActionCards'
import MemberSessionsSection from '../components/home-dashboard/MemberSessionsSection'
import CommunityHighlights from '../components/home-dashboard/CommunityHighlights'
import ResourcesFeed from '../components/home-dashboard/ResourcesFeed'
import RecentActivity from '../components/home-dashboard/RecentActivity'
import type { DashboardOverview, TierLevel } from '../types/home-dashboard'

export interface DashboardOutletContext {
  user: any
  userName: string | null
  userLevel: TierLevel
  overview: DashboardOverview | null
  overviewLoading: boolean
}

export default function HomeDashboardIndex() {
  const { user, userName, userLevel, overview, overviewLoading } =
    useOutletContext<DashboardOutletContext>()

  return (
    <div className="px-5 py-4">
      <WelcomeHero userName={userName} overview={overview} loading={overviewLoading} />
      <QuickActionCards />
      {user && <MemberSessionsSection userId={user.id} />}
      <CommunityHighlights userLevel={userLevel} />
      <ResourcesFeed userLevel={userLevel} />
      {user && <RecentActivity userId={user.id} />}
    </div>
  )
}
