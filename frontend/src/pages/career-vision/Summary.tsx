import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { pdf } from '@react-pdf/renderer'
import { CareerVisionPDF } from '../../components/CareerVisionPDF'
import Preferences, { WorkPreferences } from './Preferences'

interface CareerVisionData {
  skills: string[]
  interests: string[]
  sweetSpot: string[]
}

const CareerVisionSummary: React.FC = () => {
  const navigate = useNavigate()
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

      // Get user name
      const fullName = user.user_metadata?.full_name ||
        user.email?.split('@')[0]?.replace(/[._-]/g, ' ') ||
        'User'
      setUserName(fullName)

      // Load skills
      const { data: skillsData } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      // Load interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('interest_name')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      // Load preferences
      const { data: prefsData } = await supabase
        .from('ideal_work_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const skills = skillsData?.map((s: any) => s.skill_name) || []
      const interests = interestsData?.map((i: any) => i.interest_name) || []

      // Calculate sweet spot
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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/40 dark:via-gray-900 dark:to-purple-900/40 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400">Loading your career vision...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-indigo-900/40 dark:via-gray-900 dark:to-purple-900/40 py-12 px-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            The "Sweet Spot": Where Capability Meets Passion
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {userName} • {generatedDate}
          </p>
        </div>

        {/* Main Venn Diagram Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-12 mb-8 transition-colors duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">

            {/* Venn Diagram */}
            <div className="lg:col-span-2">
              <div className="relative h-[500px] flex items-center justify-center">
                <svg width="700" height="500" viewBox="0 0 700 500" className="mx-auto">
                  {/* Skills Circle (Left) */}
                  <circle
                    cx="250"
                    cy="250"
                    r="180"
                    className="fill-slate-50/95 dark:fill-slate-800/95 stroke-gray-800 dark:stroke-gray-200 transition-colors duration-200"
                    strokeWidth="3"
                  />

                  {/* Interests Circle (Right) */}
                  <circle
                    cx="450"
                    cy="250"
                    r="180"
                    className="fill-slate-50/95 dark:fill-slate-800/95 stroke-orange-400 dark:stroke-orange-500 transition-colors duration-200"
                    strokeWidth="3"
                  />

                  {/* Skills Label */}
                  <text x="150" y="150" fontSize="18" fontWeight="bold" className="fill-gray-800 dark:fill-gray-100">
                    Skills
                  </text>

                  {/* Skills Items */}
                  {careerData.skills.slice(0, 4).map((skill, idx) => (
                    <text
                      key={`skill-${idx}`}
                      x="150"
                      y={190 + idx * 30}
                      fontSize="14"
                      className="fill-gray-700 dark:fill-gray-300"
                    >
                      {skill}
                    </text>
                  ))}

                  {/* Interests Label */}
                  <text x="480" y="150" fontSize="18" fontWeight="bold" className="fill-orange-600 dark:fill-orange-400">
                    Interests
                  </text>

                  {/* Interests Items */}
                  {careerData.interests.slice(0, 4).map((interest, idx) => (
                    <text
                      key={`interest-${idx}`}
                      x="480"
                      y={190 + idx * 30}
                      fontSize="14"
                      className="fill-gray-700 dark:fill-gray-300"
                    >
                      {interest}
                    </text>
                  ))}

                  {/* Sweet Spot Center */}
                  <ellipse
                    cx="350"
                    cy="250"
                    rx="100"
                    ry="120"
                    className="fill-gray-700/95 dark:fill-gray-900/95 stroke-gray-600 dark:stroke-gray-500"
                    strokeWidth="2"
                  />

                  {/* Sweet Spot Name */}
                  <text
                    x="350"
                    y="230"
                    fontSize="24"
                    fontWeight="bold"
                    fill="white"
                    textAnchor="middle"
                  >
                    {userName.toUpperCase()}
                  </text>

                  {/* Sweet Spot Words */}
                  {careerData.sweetSpot.slice(0, 2).map((word, idx) => (
                    <text
                      key={`sweet-${idx}`}
                      x="350"
                      y={260 + idx * 24}
                      fontSize="13"
                      fill="white"
                      textAnchor="middle"
                    >
                      {word.charAt(0).toUpperCase() + word.slice(1)}
                    </text>
                  ))}

                  {/* Data Process Label */}
                  {careerData.sweetSpot.length > 0 && (
                    <>
                      <text
                        x="520"
                        y="180"
                        fontSize="14"
                        className="fill-gray-500 dark:fill-gray-400"
                        fontStyle="italic"
                      >
                        {careerData.sweetSpot.slice(0, 2).join(' & ')}
                      </text>
                      <line
                        x1="510"
                        y1="175"
                        x2="420"
                        y2="230"
                        className="stroke-gray-500 dark:stroke-gray-400"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    </>
                  )}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="5"
                      refY="3"
                      orient="auto"
                    >
                      <polygon points="0 0, 10 3, 0 6" className="fill-gray-500 dark:fill-gray-400" />
                    </marker>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Profile Description - Dynamic Insight */}
            <div className="lg:col-span-1 space-y-4">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                My Professional Profile
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {careerData.sweetSpot.length > 0 ? (
                  <>
                    Thrives at the intersection of <strong>{careerData.sweetSpot.slice(0, 2).join(' and ')}</strong>.
                    It's not just technical analysis; it's the application of data intelligence
                    to develop people and sustainable solutions.
                  </>
                ) : (
                  <>
                    My professional profile combines expertise in <strong>{careerData.skills.slice(0, 2).join(' and ')}</strong> with
                    a passion for <strong>{careerData.interests.slice(0, 2).join(' and ')}</strong>, creating unique value
                    through the integration of technical skills and personal interests.
                  </>
                )}
              </p>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>{careerData.skills.length}</strong> Skills •
                  <strong className="ml-2">{careerData.interests.length}</strong> Interests
                </p>
              </div>
            </div>
          </div>
        </div>


        {/* Ideal Work Preferences Dashboard */}
        {preferences && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 mb-8 transition-colors duration-200">
            <Preferences embedded initialData={preferences} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate('/career-vision')}
            className="px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium"
          >
            ← Back
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center gap-2 shadow-lg"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </>
            )
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default CareerVisionSummary
