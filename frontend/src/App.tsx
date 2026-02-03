import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

// Public Routes
import Landing from './pages/Landing'
import SignUp from './pages/auth/SignUp'
import SignIn from './pages/auth/SignIn'
import AuthCallback from './pages/AuthCallback'

// Protected Routes
import Onboarding from './pages/onboarding/Onboarding'
import NavigationPrompt from './components/navigation/NavigationPrompt'
import MainMenu from './pages/MainMenu'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Career Vision Routes
import CareerVisionWelcome from './pages/career-vision/Welcome'
import CareerVisionDashboard from './pages/career-vision/Dashboard'
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
import JDAnalyzer from './pages/resume-builder/JDAnalyzer'
import ResumeTracking from './pages/resume-builder/ResumeTracking'
import CoverLetterGenerator from './pages/resume/CoverLetterGenerator'

// Job Search Routes - New Flow
import PlanYourSearch from './pages/fast-track/PlanYourSearch'
import OnlineJobApplications from './pages/fast-track/OnlineJobApplications'
import HeadhunterSearch from './pages/job-search/HeadhunterSearch'
import NetworkingStrategy from './pages/job-search/NetworkingStrategy'
import AIRecommendations from './pages/fast-track/AIRecommendations'
import JobSearchHub from './pages/job-search/JobSearchHub'
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

// Settings
import DataManagement from './pages/settings/DataManagement'

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
    <Router basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Protected Routes */}
        {/* ... Public Routes ... */}

        {/* Basic Protected Routes */}
        <Route element={<ProtectedRoute requiredLevel="basic" />}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<NavigationPrompt />} />
          <Route path="/main-menu" element={<MainMenu />} />
          <Route path="/navigate" element={<NavigationPrompt />} />

          {/* Resume Builder Routes - Level: Basic */}
          <Route path="/resume-builder" element={<ResumeBuilderMenu />} />
          <Route path="/resume-builder/workflow" element={<ResumeBuilder />} />
          <Route path="/resume/work-experience" element={<WorkExperienceBuilder />} />
          <Route path="/resume/car-stories" element={<CARStoryBuilder />} />
          <Route path="/resume/profile" element={<ProfileBuilder />} />
          <Route path="/resume/jd-analyzer" element={<JDAnalyzer />} />
          <Route path="/resume/tracking" element={<ResumeTracking />} />
          <Route path="/resume/cover-letter" element={<CoverLetterGenerator />} />

          {/* Weekly Reinvention & Settings */}
          <Route path="/weekly-reinvention/monday-ritual" element={<MondayRitual />} />
          <Route path="/weekly-reinvention/friday-ritual" element={<FridayRitual />} />
          <Route path="/weekly-reinvention/progress" element={<ProgressDashboard />} />
          <Route path="/settings/data" element={<DataManagement />} />
        </Route>

        {/* Pro Tier Routes */}
        <Route element={<ProtectedRoute requiredLevel="pro" />}>
          <Route path="/job-search-hub" element={<JobSearchHub />} />
          <Route path="/job-search/methodology" element={<FastTrackMethodology />} />
          <Route path="/job-search/plan-your-search" element={<PlanYourSearch />} />
          <Route path="/job-search/online-applications" element={<OnlineJobApplications />} />
          <Route path="/job-search/headhunters" element={<HeadhunterSearch />} />
          <Route path="/job-search/networking" element={<NetworkingStrategy />} />
          <Route path="/job-search/ai-recommendations" element={<AIRecommendations />} />
          <Route path="/job-search/application-tracker" element={<ResumeTracking />} />
          <Route path="/job-search/social-positioning" element={<PlanYourSearch />} />
        </Route>

        {/* Executive Tier Routes */}
        <Route element={<ProtectedRoute requiredLevel="executive" />}>
          <Route path="/career-vision" element={<CareerVisionWelcome />} />
          <Route path="/career-vision/welcome" element={<CareerVisionWelcome />} />
          <Route path="/career-vision/dashboard" element={<CareerVisionDashboard />} />
          <Route path="/career-vision/skills-values" element={<SkillsValues />} />
          <Route path="/career-vision/job-history" element={<JobHistory />} />
          <Route path="/career-vision/preferences" element={<Preferences />} />
          <Route path="/career-vision/summary" element={<CareerVisionSummary />} />

          <Route path="/interview" element={<InterviewMastery />} />
          <Route path="/interview/new" element={<NewInterview />} />
          <Route path="/interview/questions" element={<QuestionBank />} />
          <Route path="/interview/questions/:questionId/answer" element={<QuestionAnswer />} />
          <Route path="/interview/:id" element={<InterviewDetail />} />
          <Route path="/interview/:id/interview-type" element={<InterviewTypeGuide />} />
          <Route path="/interview/:id/research" element={<ResearchForm />} />
          <Route path="/interview/:id/jd-comparison" element={<JDComparisonForm />} />
          <Route path="/interview/:id/practice" element={<PracticeDashboard />} />
        </Route>

        {/* Weekly Reinvention Routes - Available for All Levels */}
        <Route path="/weekly-reinvention/monday-ritual" element={<MondayRitual />} />
        <Route path="/weekly-reinvention/friday-ritual" element={<FridayRitual />} />
        <Route path="/weekly-reinvention/progress" element={<ProgressDashboard />} />

        {/* Legacy Routes - Redirect to new structure */}
        <Route path="/resume-builder/car-stories" element={<CARStoryBuilder />} />
        <Route path="/resume-builder/profile" element={<ProfileBuilder />} />
        <Route path="/resume-builder/work-experience" element={<WorkExperienceBuilder />} />
        <Route path="/resume-builder/jd-analyzer" element={<JDAnalyzer />} />
        <Route path="/resume-builder/tracking" element={<ResumeTracking />} />
        <Route path="/fast-track/plan-your-search" element={<PlanYourSearch />} />
        <Route path="/fast-track/apply-smart-online" element={<OnlineJobApplications />} />
        <Route path="/fast-track/ai-recommendations" element={<AIRecommendations />} />

        {/* Settings & Utilities */}
        <Route path="/settings/data" element={<DataManagement />} />

        {/* 404 - Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  )
}

export default App