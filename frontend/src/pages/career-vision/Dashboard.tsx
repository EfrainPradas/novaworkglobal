import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { PlayCircle, CheckCircle2, ChevronRight, Video } from 'lucide-react'

export default function CareerVisionDashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sectionsStatus, setSectionsStatus] = useState({
    skillsValues: false,
    jobHistory: false,
    preferences: false
  })
  const [loading, setLoading] = useState(true)
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    async function loadStatus() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: progress } = await supabase
        .from('user_progress')
        .select('step_id')
        .eq('user_id', user.id)
        .eq('module_id', 'career-vision')

      if (progress) {
        const completed = progress.map(p => p.step_id)
        setSectionsStatus({
          skillsValues: completed.includes('skills-values'),
          jobHistory: completed.includes('job-history'),
          preferences: completed.includes('preferences')
        })
      }
      setLoading(false)
    }
    loadStatus()
  }, [])

  const sections = [
    {
      id: 'skills-values',
      title: t('careerVision.journey.skillsValues', 'Skills & Interests'),
      description: t('careerVision.journey.skillsValuesDesc', 'Identify your core competencies and what drives your professional satisfaction.'),
      icon: '🎯',
      route: '/dashboard/career-vision/skills-values',
      completed: sectionsStatus.skillsValues,
      videoSrc: `${import.meta.env.BASE_URL}videos/The_Skills_&_Interests_Assessment.mp4`
    },
    {
      id: 'job-history',
      title: t('careerVision.journey.jobHistory', 'Job History Analysis'),
      description: t('careerVision.journey.jobHistoryDesc', 'Reflect on your past roles to identify patterns of success and areas for growth.'),
      icon: '📋',
      route: '/dashboard/career-vision/job-history',
      completed: sectionsStatus.jobHistory,
      videoSrc: `${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`
    },
    {
      id: 'preferences',
      title: t('careerVision.journey.preferences', 'Ideal Work Preferences'),
      description: t('careerVision.journey.preferencesDesc', 'Define your must-haves, deal-breakers, and ideal organizational culture.'),
      icon: '⚙️',
      route: '/dashboard/career-vision/preferences',
      completed: sectionsStatus.preferences,
      videoSrc: `${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`
    }
  ]

  const totalCompleted = Object.values(sectionsStatus).filter(Boolean).length
  const progressPercent = Math.round((totalCompleted / 3) * 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <BackButton to="/dashboard" label={t('careerVision.dashboard.backToDashboard', 'Back to Main Dashboard')} />
          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 pr-24">
                {t('careerVision.journey.title', 'Tu Viaje de Visión de Carrera')}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                <LearnMoreLink 
                  label={t('careerVision.journey.whatIsCareerVision', '¿Qué es Visión de Carrera?')}
                  description={t('careerVision.journey.clarityHired', 'La claridad te consigue trabajo 2x más rápido')}
                  onClick={() => navigate('/dashboard/career-vision/learn-more')} 
                />
                <button
                  onClick={() => setActiveVideoSrc(`${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`)}
                  className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 transition-colors"
                >
                  <Video size={16} />
                  {t('common.watchVideo', 'Ver video')}
                </button>
              </div>
            </div>

            <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2 text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">{t('careerVision.journey.progress', 'Progress')}</span>
                <span className="text-teal-600 dark:text-teal-400">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {sections.map((section) => (
            <div
              key={section.id}
              onClick={() => navigate(section.route)}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all p-6 cursor-pointer group"
            >
              <div className="text-5xl mb-4 transition-transform group-hover:scale-110 duration-300">{section.icon}</div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                {section.title}
                {section.completed && <CheckCircle2 className="text-teal-500" size={20} />}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                {section.description}
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  className={`w-full px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    section.completed 
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-white' 
                      : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-600/20'
                  }`}
                >
                  {section.completed ? t('common.review', 'Revisar') : t('common.start', 'Empezar')}
                  <ChevronRight size={18} />
                </button>

                <div className="flex items-center justify-between px-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveVideoSrc(section.videoSrc) }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                  >
                    <PlayCircle size={14} />
                    {t('common.watchVideo', 'Ver video')}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate('/dashboard/career-vision/learn-more') }}
                    className="text-xs font-semibold text-slate-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 transition-colors"
                  >
                    {t('careerVision.journey.exploreSection', 'Explorar sección')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalCompleted === 3 ? (
          <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 dark:from-teal-900/20 dark:to-blue-900/20 rounded-2xl p-8 border border-teal-200 dark:border-teal-800 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t('careerVision.journey.completeTitle', '¡Visión de Carrera Completa!')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-2xl mx-auto">
              {t('careerVision.journey.completeSubtitle', 'Has completado todas las secciones. Ahora tienes una base sólida para tu estrategia de búsqueda de empleo.')}
            </p>
            <button
              onClick={() => navigate('/dashboard/career-vision/summary')}
              className="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 active:scale-95"
            >
              {t('careerVision.journey.viewSummary', 'Ver tu Visión de Carrera →')}
            </button>
          </div>
        ) : (
          <div className="text-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 border border-dashed border-slate-300 dark:border-slate-700">
            <p className="text-slate-600 dark:text-slate-400">
              {t('careerVision.journey.incomplete', 'Completa estas secciones para descubrir tu camino profesional ideal')}
            </p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideoSrc && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveVideoSrc(null)}
        >
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" />
          <div 
            className="relative w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl z-10"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveVideoSrc(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full aspect-video">
              <video 
                src={activeVideoSrc} 
                className="w-full h-full outline-none"
                controls 
                autoPlay 
                playsInline 
                controlsList="nodownload"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
