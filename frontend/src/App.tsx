import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Guided Tour
import { GuidedTourProvider } from './components/guided-tour'
import { GuidedTour } from './components/guided-tour'

// Public Routes
import Landing from './pages/Landing'
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import AuthCallback from './pages/AuthCallback'
import NovaNextPage from './pages/programs/NovaNext'
import NovaRearchitectPage from './pages/programs/NovaRearchitect'
import NovaAlignPage from './pages/programs/NovaAlign'

// Protected Routes
import Onboarding from './pages/onboarding/Onboarding'
import NavigationPrompt from './components/navigation/NavigationPrompt'
import MainMenu from './pages/MainMenu'
import Dashboard from './pages/Dashboard'
import HomeDashboard from './pages/HomeDashboard'
import HomeDashboardIndex from './pages/HomeDashboardIndex'
import DashboardModules from './pages/DashboardModules'
import NetworkingSessionsPage from './pages/dashboard/networking-sessions/NetworkingSessionsPage'
import MemberCalendarPage from './pages/dashboard/member-calendar/MemberCalendarPage'
import CommunityPage from './pages/dashboard/community/CommunityPage'
import CurationPage from './pages/dashboard/career-feed-curation/CurationPage'
import AcademyPage from './pages/Academy'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ClientSharedResources from './pages/client/ClientSharedResources'
import StickyBoard from './pages/dashboard/StickyBoard'
import SupportAgentWidget from './components/agent/SupportAgentWidget'

// Career Vision Routes
import CareerVisionDashboard from './pages/career-vision/Dashboard'
import CareerVisionLearnMore from './pages/career-vision/CareerVisionLearnMore'
import SkillsValues from './pages/career-vision/SkillsValues'
import JobHistory from './pages/career-vision/JobHistory'
import Preferences from './pages/career-vision/Preferences'
import CareerVisionSummary from './pages/career-vision/Summary'

// Resume Builder Routes - New Flow
import ResumeBuilderMenu from './pages/resume-builder/ResumeBuilderMenu'
import ResumeBuilder from './pages/resume-builder/ResumeBuilder'
import WorkExperienceBuilder from './pages/resume-builder/WorkExperienceBuilder'
import CARStoryBuilder from './pages/resume-builder/CARStoryBuilder'
import ProfileBuilder from './pages/resume-builder/ProfileBuilder'
import AccomplishmentLibrary from './pages/resume-builder/AccomplishmentLibrary'
import AccomplishmentsHub from './pages/resume-builder/AccomplishmentsHub'
import AccomplishmentBankLearnMore from './pages/resume-builder/AccomplishmentBankLearnMore'
import ResumeBuilderLearnMore from './pages/resume-builder/ResumeBuilderLearnMore'
import ResumeTypeSelection from './pages/resume-builder/ResumeTypeSelection'
import ResumeTypeLearnMore from './pages/resume-builder/ResumeTypeLearnMore'
import WorkExperienceLearnMore from './pages/resume-builder/WorkExperienceLearnMore'
import ProfileLearnMore from './pages/resume-builder/ProfileLearnMore'
import ResumeTracking from './pages/resume-builder/ResumeTracking'
import ResumeFinalPreview from './pages/resume-builder/ResumeFinalPreview'
import CoverLetterGenerator from './pages/resume/CoverLetterGenerator'
import JDAnalyzer from './pages/resume-builder/JDAnalyzer'

// Resume Builder V2 Routes
import WorkHistoryIntake from './pages/resume-builder/WorkHistoryIntake'
import StoryCardsManager from './pages/resume-builder/StoryCardsManager'
import PositioningQuestionnaire from './pages/resume-builder/PositioningQuestionnaire'
import ContactInfoPage from './pages/resume-builder/ContactInfoPage'
import EducationBuilder from './pages/resume-builder/EducationBuilder'
import AwardsBuilder from './pages/resume-builder/AwardsBuilder'

// Job Search Routes - New Flow
import PlanYourSearch from './pages/fast-track/PlanYourSearch'
import OnlineJobApplications from './pages/fast-track/OnlineJobApplications'
import HeadhunterSearch from './pages/job-search/HeadhunterSearch'
import NetworkingStrategy from './pages/job-search/NetworkingStrategy'
import AIRecommendations from './pages/fast-track/AIRecommendations'
import JobSearchHub from './pages/job-search/JobSearchHub'
import StrategicJobSearchLearnMore from './pages/job-search/StrategicJobSearchLearnMore'
import FastTrackMethodology from './pages/fast-track/FastTrackMethodology'

// Interview Mastery System Routes
import InterviewMastery from './pages/interview/InterviewMastery'
import InterviewDetail from './pages/interview/InterviewDetail'
import NewInterview from './pages/interview/NewInterview'
import QuestionBank from './pages/interview/QuestionBank'
import QuestionAnswer from './pages/interview/QuestionAnswer'
import InterviewTypeGuide from './pages/interview/InterviewTypeGuide'
import ResearchForm from './pages/interview/ResearchForm'
import JDComparisonForm from './pages/interview/JDComparisonForm'
import PracticeDashboard from './pages/interview/PracticeDashboard'

// Weekly Reinvention Routes
import MondayRitual from './pages/weekly-reinvention/MondayRitual'
import FridayRitual from './pages/weekly-reinvention/FridayRitual'
import ProgressDashboard from './pages/weekly-reinvention/ProgressDashboard'

// Alternative Landing Page (v2)
import LandingPageV2 from './pages/LandingPageV2'

// Settings
import DataManagement from './pages/settings/DataManagement'

// Admin & System
import TranslationEditor from './pages/admin/TranslationEditor'

// Coach
import CoachRoute from './components/auth/CoachRoute'
import CoachDashboard from './pages/coach/CoachDashboard'
import ClientCoaching from './pages/coach/ClientCoaching'
import CoachResources from './pages/coach/CoachResources'

// 404 Component
function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/navigate" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
          Go to Navigation
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <GuidedTourProvider>
      <GuidedTour />
      <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPageV2 />} />
        <Route path="/programs/novanext" element={<NovaNextPage />} />
        <Route path="/programs/novarearchitect" element={<NovaRearchitectPage />} />
        <Route path="/programs/novaalign" element={<NovaAlignPage />} />
        <Route path="/design-v1" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        {/* ... Public Routes ... */}

        {/* Essentials Protected Routes */}
        <Route element={<ProtectedRoute requiredLevel="essentials" />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/main-menu" element={<MainMenu />} />
          <Route path="/navigate" element={<NavigationPrompt />} />
          <Route path="/shared-resources" element={<ClientSharedResources />} />

          {/* Home Dashboard Shell — persistent layout with ALL nested module routes */}
          <Route path="/dashboard" element={<HomeDashboard />}>
            {/* Default dashboard index */}
            <Route index element={<HomeDashboardIndex />} />

            {/* Dashboard sub-pages */}
            <Route path="modules" element={<DashboardModules />} />
            <Route path="networking-sessions" element={<NetworkingSessionsPage />} />
            <Route path="member-calendar" element={<MemberCalendarPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="career-feed-curation" element={<CurationPage />} />

            {/* Resume Builder Routes - nested inside /dashboard */}
            <Route path="resume-builder" element={<ResumeBuilderMenu />} />
            <Route path="resume-builder/workflow" element={<ResumeBuilder />} />
            <Route path="resume-builder/profile" element={<ProfileBuilder />} />
            <Route path="resume-builder/jd-analyzer" element={<JDAnalyzer />} />
            <Route path="resume-builder/learn-more" element={<ResumeBuilderLearnMore />} />
            <Route path="resume/work-experience" element={<WorkExperienceBuilder />} />
            <Route path="resume/car-stories" element={<CARStoryBuilder />} />
            <Route path="resume/accomplishment-library" element={<AccomplishmentLibrary />} />
            <Route path="resume/accomplishments-hub" element={<AccomplishmentsHub />} />
            <Route path="resume/accomplishment-bank-learn-more" element={<AccomplishmentBankLearnMore />} />
            <Route path="resume/profile" element={<ProfileBuilder />} />
            <Route path="resume/type-selection" element={<ResumeTypeSelection />} />
            <Route path="resume/type-selection/learn-more" element={<ResumeTypeLearnMore />} />
            <Route path="resume/work-experience/learn-more" element={<WorkExperienceLearnMore />} />
            <Route path="resume/profile/learn-more" element={<ProfileLearnMore />} />
            <Route path="resume/final-preview" element={<ResumeFinalPreview />} />
            <Route path="resume/tracking" element={<Navigate to="/dashboard/job-search/online-applications?tab=resumes" replace />} />
            <Route path="resume/cover-letter" element={<CoverLetterGenerator />} />
            <Route path="resume/contact-info" element={<ContactInfoPage />} />
            <Route path="resume/work-history" element={<WorkHistoryIntake />} />
            <Route path="resume/story-cards" element={<StoryCardsManager />} />
            <Route path="resume/education" element={<EducationBuilder />} />
            <Route path="resume/awards" element={<AwardsBuilder />} />
            <Route path="resume/questionnaire" element={<PositioningQuestionnaire />} />

            {/* Redirects: old resume-builder/* URLs → new resume/* paths */}
            <Route path="resume-builder/contact-info" element={<Navigate to="/dashboard/resume/contact-info" replace />} />
            <Route path="resume-builder/work-experience" element={<Navigate to="/dashboard/resume/work-experience" replace />} />
            <Route path="resume-builder/work-history" element={<Navigate to="/dashboard/resume/work-history" replace />} />
            <Route path="resume-builder/car-stories" element={<Navigate to="/dashboard/resume/car-stories" replace />} />
            <Route path="resume-builder/story-cards" element={<Navigate to="/dashboard/resume/story-cards" replace />} />
            <Route path="resume-builder/accomplishment-library" element={<Navigate to="/dashboard/resume/accomplishment-library" replace />} />
            <Route path="resume-builder/accomplishments-hub" element={<Navigate to="/dashboard/resume/accomplishments-hub" replace />} />
            <Route path="resume-builder/accomplishment-bank-learn-more" element={<Navigate to="/dashboard/resume/accomplishment-bank-learn-more" replace />} />
            <Route path="resume-builder/education" element={<Navigate to="/dashboard/resume/education" replace />} />
            <Route path="resume-builder/awards" element={<Navigate to="/dashboard/resume/awards" replace />} />
            <Route path="resume-builder/questionnaire" element={<Navigate to="/dashboard/resume/questionnaire" replace />} />
            <Route path="resume-builder/type-selection" element={<Navigate to="/dashboard/resume/type-selection" replace />} />
            <Route path="resume-builder/type-selection/learn-more" element={<Navigate to="/dashboard/resume/type-selection/learn-more" replace />} />
            <Route path="resume-builder/work-experience/learn-more" element={<Navigate to="/dashboard/resume/work-experience/learn-more" replace />} />
            <Route path="resume-builder/profile/learn-more" element={<Navigate to="/dashboard/resume/profile/learn-more" replace />} />
            <Route path="resume-builder/final-preview" element={<Navigate to="/dashboard/resume/final-preview" replace />} />
            <Route path="resume-builder/cover-letter" element={<Navigate to="/dashboard/resume/cover-letter" replace />} />
            <Route path="resume-builder/tracking" element={<Navigate to="/dashboard/job-search/online-applications?tab=resumes" replace />} />

            {/* Job Search Routes - nested inside /dashboard (momentum tier only) */}
            <Route path="job-search-hub" element={<JobSearchHub />} />
            <Route path="job-search/learn-more" element={<StrategicJobSearchLearnMore />} />
            <Route path="job-search/methodology" element={<FastTrackMethodology />} />
            <Route path="job-search/plan-your-search" element={<PlanYourSearch />} />
            <Route path="job-search/online-applications" element={<OnlineJobApplications />} />
            <Route path="job-search/headhunters" element={<HeadhunterSearch />} />
            <Route path="job-search/networking" element={<NetworkingStrategy />} />
            <Route path="job-search/ai-recommendations" element={<AIRecommendations />} />
            <Route path="job-search/application-tracker" element={<ResumeTracking />} />
            <Route path="job-search/social-positioning" element={<PlanYourSearch />} />

            {/* Career Vision Routes - nested inside /dashboard (momentum tier only) */}
            <Route path="career-vision" element={<Navigate to="/dashboard/career-vision/dashboard" replace />} />
            <Route path="career-vision/welcome" element={<Navigate to="/dashboard/career-vision/dashboard" replace />} />
            <Route path="career-vision/dashboard" element={<CareerVisionDashboard />} />
            <Route path="career-vision/skills-values" element={<SkillsValues />} />
            <Route path="career-vision/job-history" element={<JobHistory />} />
            <Route path="career-vision/preferences" element={<Preferences />} />
            <Route path="career-vision/summary" element={<CareerVisionSummary />} />
            <Route path="career-vision/learn-more" element={<CareerVisionLearnMore />} />

            {/* Interview Routes - nested inside /dashboard (executive tier only) */}
            <Route path="interview" element={<InterviewMastery />} />
            <Route path="interview/new" element={<NewInterview />} />
            <Route path="interview/questions" element={<QuestionBank />} />
            <Route path="interview/questions/:questionId/answer" element={<QuestionAnswer />} />
            <Route path="interview/:id" element={<InterviewDetail />} />
            <Route path="interview/:id/interview-type" element={<InterviewTypeGuide />} />
            <Route path="interview/:id/research" element={<ResearchForm />} />
            <Route path="interview/:id/jd-comparison" element={<JDComparisonForm />} />
            <Route path="interview/:id/practice" element={<PracticeDashboard />} />

            {/* Weekly Reinvention & Settings - nested inside /dashboard */}
            <Route path="weekly-reinvention/monday-ritual" element={<MondayRitual />} />
            <Route path="weekly-reinvention/friday-ritual" element={<FridayRitual />} />
            <Route path="weekly-reinvention/progress" element={<ProgressDashboard />} />
            <Route path="settings/data" element={<DataManagement />} />
            <Route path="coaching" element={<ClientCoaching />} />
            <Route path="sticky-board" element={<StickyBoard />} />
          </Route>
          
          {/* Academy - Standalone page with its own sidebar */}
          <Route path="/dashboard/academy" element={<AcademyPage />} />
        </Route>

        {/* Backward compatibility redirects — old routes to new dashboard structure */}
        <Route path="/resume-builder/*" element={<Navigate to="/dashboard/resume-builder" replace />} />
        <Route path="/resume/*" element={<Navigate to="/dashboard/resume" replace />} />
        <Route path="/job-search-hub" element={<Navigate to="/dashboard/job-search-hub" replace />} />
        <Route path="/job-search/*" element={<Navigate to="/dashboard/job-search" replace />} />
        <Route path="/career-vision/*" element={<Navigate to="/dashboard/career-vision" replace />} />
        <Route path="/interview/*" element={<Navigate to="/dashboard/interview" replace />} />
        <Route path="/weekly-reinvention/monday-ritual" element={<Navigate to="/dashboard/weekly-reinvention/monday-ritual" replace />} />
        <Route path="/weekly-reinvention/friday-ritual" element={<Navigate to="/dashboard/weekly-reinvention/friday-ritual" replace />} />
        <Route path="/weekly-reinvention/progress" element={<Navigate to="/dashboard/weekly-reinvention/progress" replace />} />

        {/* Coach-Only Routes */}
        <Route element={<CoachRoute />}>
          <Route path="/coach" element={<CoachDashboard />} />
          <Route path="/coach/resources" element={<CoachResources />} />
        </Route>

        {/* Hidden Admin Routes */}
        <Route path="/admin/translations" element={<TranslationEditor />} />

        {/* Legacy Routes - Redirect to new structure */}
        <Route path="/resume-builder/car-stories" element={<CARStoryBuilder />} />
        <Route path="/resume-builder/profile" element={<ProfileBuilder />} />
        <Route path="/resume-builder/work-experience" element={<WorkExperienceBuilder />} />

        <Route path="/resume-builder/tracking" element={<Navigate to="/dashboard/job-search/online-applications?tab=resumes" replace />} />
        <Route path="/fast-track/plan-your-search" element={<PlanYourSearch />} />
        <Route path="/fast-track/apply-smart-online" element={<OnlineJobApplications />} />
        <Route path="/fast-track/ai-recommendations" element={<AIRecommendations />} />

        {/* Settings & Utilities */}
        <Route path="/settings/data" element={<DataManagement />} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <SupportAgentWidget />
    </Router>
    </GuidedTourProvider>
  )
}

export default App