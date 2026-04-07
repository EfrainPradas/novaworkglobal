import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { pdf } from '@react-pdf/renderer'
import { CareerVisionPDF } from '../../components/CareerVisionPDF'
import Preferences, { WorkPreferences } from './Preferences'
import { ArrowLeft, Download, Loader2, Sparkles, Target, Heart, Briefcase } from 'lucide-react'

interface CareerVisionData {
  skills: string[]
  interests: string[]
  sweetSpot: string[]
}

const CareerVisionSummary: React.FC = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [careerData, setCareerData] = useState<CareerVisionData>({
    skills: [],
    interests: [],
    sweetSpot: []
  })
  const [preferences, setPreferences] = useState<WorkPreferences | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [downloading, setDownloading] = useState(false)
  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  useEffect(() => {
    loadCareerVision()
  }, [])

  const loadCareerVision = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const fullName = user.user_metadata?.full_name ||
        user.email?.split('@')[0]?.replace(/[._-]/g, ' ') ||
        'User'
      setUserName(fullName)

      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('interest_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const { data: prefsData } = await supabase
        .from('ideal_work_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const skills = skillsData?.map((s: any) => s.skill_name) || []
      const interests = interestsData?.map((i: any) => i.interest_name) || []

      const skillWords = skills.flatMap((s: string) =>
        s.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      )
      const interestWords = interests.flatMap((i: string) =>
        i.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3)
      )
      const sweetSpot = [...new Set(skillWords.filter((w: string) => interestWords.includes(w)))]

      setCareerData({ skills, interests, sweetSpot })
      setPreferences(prefsData)

    } catch (error) {
      console.error('Error loading career vision:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    setDownloading(true)
    try {
      const blob = await pdf(
        <CareerVisionPDF
          careerData={careerData}
          preferences={preferences}
          userName={userName}
          generatedDate={generatedDate}
        />
      ).toBlob()

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Career_Vision_Profile_${new Date().getFullYear()}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Header */}
        <div className="mb-10">
          <button
            onClick={() => navigate('/dashboard/career-vision')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('careerVision.dashboard.backToDashboard', 'Back to Career Vision')}
          </button>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
                <span className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </span>
                {t('careerVision.summary.title', 'Your Career Vision Profile')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {userName} &middot; {generatedDate}
              </p>
            </div>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {downloading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('careerVision.summary.generating', 'Generating PDF...')}</>
              ) : (
                <><Download className="w-4 h-4" /> {t('careerVision.summary.downloadPdf', 'Download PDF')}</>
              )}
            </button>
          </div>
        </div>

        {/* Sweet Spot Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            {t('careerVision.summary.sweetSpotTitle', 'The "Sweet Spot": Where Capability Meets Passion')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-8">
            {t('careerVision.summary.sweetSpotDesc', 'The intersection of your skills and interests defines your unique professional value.')}
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Skills Card */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('careerVision.summary.skills', 'Skills')}</h3>
                  <p className="text-xs text-gray-500">{careerData.skills.length} {t('careerVision.summary.identified', 'identified')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {careerData.skills.map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-primary-200 dark:border-primary-800">
                    {skill}
                  </span>
                ))}
                {careerData.skills.length === 0 && (
                  <p className="text-sm text-gray-400 italic">{t('careerVision.summary.noData', 'No data yet')}</p>
                )}
              </div>
            </div>

            {/* Sweet Spot Center */}
            <div className="bg-primary-600 rounded-2xl p-6 text-white flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold mb-2">{userName}</h3>
              <p className="text-sm text-white/80 mb-4">{t('careerVision.summary.sweetSpotLabel', 'Your Sweet Spot')}</p>
              {careerData.sweetSpot.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {careerData.sweetSpot.slice(0, 5).map((word, idx) => (
                    <span key={idx} className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      {word.charAt(0).toUpperCase() + word.slice(1)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/60 italic">{t('careerVision.summary.completeModules', 'Complete Skills & Interests to discover your sweet spot')}</p>
              )}
            </div>

            {/* Interests Card */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl p-6 border border-primary-100 dark:border-primary-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{t('careerVision.summary.interests', 'Interests')}</h3>
                  <p className="text-xs text-gray-500">{careerData.interests.length} {t('careerVision.summary.identified', 'identified')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {careerData.interests.map((interest, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg border border-primary-200 dark:border-primary-800">
                    {interest}
                  </span>
                ))}
                {careerData.interests.length === 0 && (
                  <p className="text-sm text-gray-400 italic">{t('careerVision.summary.noData', 'No data yet')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Insight */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">{t('careerVision.summary.profileInsight', 'Professional Profile Insight')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {careerData.sweetSpot.length > 0 ? (
                <>
                  {t('careerVision.summary.insightWithSweet', 'Thrives at the intersection of')}{' '}
                  <strong>{careerData.sweetSpot.slice(0, 2).join(` ${t('common.and', 'and')} `)}</strong>.{' '}
                  {t('careerVision.summary.insightCont', 'This unique combination creates differentiated value in the market.')}
                </>
              ) : (
                <>
                  {t('careerVision.summary.insightGeneric', 'Combines expertise in')}{' '}
                  <strong>{careerData.skills.slice(0, 2).join(` ${t('common.and', 'and')} `)}</strong>{' '}
                  {t('careerVision.summary.insightWith', 'with a passion for')}{' '}
                  <strong>{careerData.interests.slice(0, 2).join(` ${t('common.and', 'and')} `)}</strong>.
                </>
              )}
            </p>
            <div className="flex gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400">
              <span><strong className="text-primary-600">{careerData.skills.length}</strong> {t('careerVision.summary.skills', 'Skills')}</span>
              <span><strong className="text-primary-600">{careerData.interests.length}</strong> {t('careerVision.summary.interests', 'Interests')}</span>
              <span><strong className="text-primary-600">{careerData.sweetSpot.length}</strong> {t('careerVision.summary.overlaps', 'Overlaps')}</span>
            </div>
          </div>
        </div>

        {/* Ideal Work Preferences */}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 mb-8">
            <Preferences embedded initialData={preferences} />
          </div>
        )}

      </div>
    </div>
  )
}

export default CareerVisionSummary
