import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation, INTERVIEW_TYPE_DESCRIPTIONS } from '../../types/interview'

export default function InterviewTypeGuide() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [interview, setInterview] = useState<InterviewPreparation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInterview()
  }, [id])

  const loadInterview = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_preparations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setInterview(data)
    } catch (error) {
      console.error('Error loading interview:', error)
      navigate('/interview')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!interview) return null

  const hasInterviewType = interview.interview_type_who || interview.interview_type_how ||
                          interview.interview_type_when || interview.interview_type_how_many

  // Generate tailored tips based on interview type combination
  const generateTips = () => {
    const tips: string[] = []

    // WHO-based tips
    if (interview.interview_type_who === 'HR/Recruiter') {
      tips.push('Be extra polished - HR professionals are trained to spot inconsistencies')
      tips.push('Use the PAR methodology for every behavioral question')
      tips.push('Prepare for culture fit questions')
      tips.push('Have clear, honest answers about gaps in employment')
    } else if (interview.interview_type_who === 'Hiring Manager') {
      tips.push('Focus on solving THEIR problems, not just listing your experience')
      tips.push('Ask about their biggest challenges in the role')
      tips.push('Show how you can start contributing quickly')
      tips.push('Be conversational - they may be less trained in interviewing')
    } else if (interview.interview_type_who === 'Panel') {
      tips.push('Make eye contact with all panel members, not just the questioner')
      tips.push('Take notes on who asks what to personalize follow-ups')
      tips.push('Stay calm - panel interviews are designed to test composure')
      tips.push('Address the person who asked, but include others with your eyes')
    }

    // HOW-based tips
    if (interview.interview_type_how === 'Virtual') {
      tips.push('Test your technology 1 hour before (camera, mic, internet)')
      tips.push('Ensure good lighting - face a window or use a lamp')
      tips.push('Clean background or use a professional virtual background')
      tips.push('Position camera at eye level')
      tips.push('Keep notes off-screen so you don\'t obviously read')
    } else if (interview.interview_type_how === 'In-person') {
      tips.push('Dress one level above the company dress code')
      tips.push('Arrive 10 minutes early (but not more than 15)')
      tips.push('Bring 3-5 printed copies of your resume')
      tips.push('Prepare a firm handshake and maintain good posture')
      tips.push('Be aware of your body language throughout')
    } else if (interview.interview_type_how === 'AI') {
      tips.push('Practice with a timer - AI interviews are strictly timed')
      tips.push('Use keywords from the job description in your answers')
      tips.push('Smile more than normal - AI reads facial expressions')
      tips.push('Look at the camera, not the screen')
      tips.push('Speak clearly and avoid long pauses')
    }

    // WHEN-based tips
    if (interview.interview_type_when === 'Screening') {
      tips.push('Keep answers concise - 20-30 minute format is tight')
      tips.push('Focus on hitting the basics from your resume')
      tips.push('Prepare your "tell me about yourself" answer (2 minutes)')
      tips.push('Have 2-3 good questions ready for the end')
    } else if (interview.interview_type_when === 'Mid-process') {
      tips.push('Prepare 3-5 detailed PAR stories showing deep expertise')
      tips.push('Be ready for technical deep-dives')
      tips.push('Ask about team dynamics and day-to-day responsibilities')
      tips.push('This is your chance to really showcase your skills')
    } else if (interview.interview_type_when === 'Final') {
      tips.push('Prepare to meet multiple people (often 2-4 hours total)')
      tips.push('Research everyone you\'ll meet beforehand')
      tips.push('Be ready to discuss compensation and start date')
      tips.push('Ask about next steps and timeline')
      tips.push('This is about "do we want to work with this person?"')
    }

    // HOW MANY-based tips
    if (interview.interview_type_how_many === 'Panel') {
      tips.push('Bring enough copies of your resume for everyone')
      tips.push('Learn everyone\'s names and roles beforehand if possible')
      tips.push('Distribute your attention evenly across all panelists')
    } else if (interview.interview_type_how_many === 'Group') {
      tips.push('Show leadership but don\'t dominate the conversation')
      tips.push('Be supportive of other candidates - they\'re watching')
      tips.push('Ask thoughtful questions that help the group')
    } else if (interview.interview_type_how_many === 'Individual') {
      tips.push('Build a personal connection - 1-on-1 is more intimate')
      tips.push('Mirror their energy level (formal vs casual)')
      tips.push('Can adjust your approach based on their reactions')
    }

    return tips
  }

  const tips = generateTips()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/interview/${id}`)}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Back to Interview
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎭 Identify Interview Type
          </h1>
          <p className="text-gray-600">
            Understand your interview type to tailor your strategy
          </p>
        </div>

        {!hasInterviewType ? (
          // No interview type set
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Interview Type Not Set
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't specified the interview type yet. Set it up to get tailored strategies!
            </p>
            <button
              onClick={() => navigate(`/interview/${id}/edit`)}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700"
            >
              Edit Interview Details
            </button>
          </div>
        ) : (
          <>
            {/* Current Interview Type */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Your Interview Configuration
                  </h2>
                </div>
                <button
                  onClick={() => navigate(`/interview/${id}/edit`)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {interview.interview_type_who && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-blue-700 mb-1">WHO</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {interview.interview_type_who}
                    </div>
                  </div>
                )}

                {interview.interview_type_how && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-green-700 mb-1">HOW</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {interview.interview_type_how}
                    </div>
                  </div>
                )}

                {interview.interview_type_when && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-purple-700 mb-1">WHEN</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {interview.interview_type_when}
                    </div>
                  </div>
                )}

                {interview.interview_type_how_many && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-orange-700 mb-1">HOW MANY</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {interview.interview_type_how_many}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tailored Strategy */}
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl shadow-lg p-6 mb-6 text-white">
              <h2 className="text-2xl font-bold mb-4">
                🎯 Your Tailored Strategy
              </h2>
              <div className="space-y-3">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-white/95">
                      {tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimension Breakdown */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Dimension Breakdown
              </h2>

              {/* WHO */}
              {interview.interview_type_who && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">👤</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        WHO: {interview.interview_type_who}
                      </h3>
                      <p className="text-gray-600">
                        {INTERVIEW_TYPE_DESCRIPTIONS.WHO[interview.interview_type_who]}
                      </p>
                    </div>
                  </div>

                  {interview.interview_type_who === 'HR/Recruiter' && (
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Characteristics:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Professional interviewers with training</li>
                        <li>Know behavioral interviewing techniques</li>
                        <li>Looking for red flags and culture fit</li>
                        <li>Will probe inconsistencies</li>
                      </ul>
                    </div>
                  )}

                  {interview.interview_type_who === 'Hiring Manager' && (
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Characteristics:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Needs someone to solve THEIR problems</li>
                        <li>May be less trained in interviewing</li>
                        <li>Focuses on technical and role fit</li>
                        <li>More conversational approach</li>
                      </ul>
                    </div>
                  )}

                  {interview.interview_type_who === 'Panel' && (
                    <div className="bg-blue-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Characteristics:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>2-5 people interviewing simultaneously</li>
                        <li>Each has different focus area</li>
                        <li>Can be intimidating</li>
                        <li>Common in final rounds</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* HOW */}
              {interview.interview_type_how && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">
                      {interview.interview_type_how === 'Virtual' ? '💻' :
                       interview.interview_type_how === 'In-person' ? '🤝' : '🤖'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        HOW: {interview.interview_type_how}
                      </h3>
                      <p className="text-gray-600">
                        {INTERVIEW_TYPE_DESCRIPTIONS.HOW[interview.interview_type_how]}
                      </p>
                    </div>
                  </div>

                  {interview.interview_type_how === 'Virtual' && (
                    <div className="bg-green-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Preparation Checklist:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Test technology 1 hour before</li>
                        <li>Good lighting (face window or use lamp)</li>
                        <li>Clean/professional background</li>
                        <li>Camera at eye level</li>
                        <li>Minimize distractions (phone, pets, etc.)</li>
                      </ul>
                    </div>
                  )}

                  {interview.interview_type_how === 'In-person' && (
                    <div className="bg-green-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Preparation Checklist:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Professional attire (one level above dress code)</li>
                        <li>Print 3-5 copies of resume</li>
                        <li>Arrive 10 minutes early</li>
                        <li>Prepare firm handshake</li>
                        <li>Be aware of body language</li>
                      </ul>
                    </div>
                  )}

                  {interview.interview_type_how === 'AI' && (
                    <div className="bg-green-50 rounded-lg p-4 mt-4">
                      <div className="font-semibold text-gray-900 mb-2">Preparation Checklist:</div>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Practice with timer (responses are timed)</li>
                        <li>Use keywords from job description</li>
                        <li>Smile more than normal (AI reads expressions)</li>
                        <li>Look at camera, not screen</li>
                        <li>Speak clearly, avoid long pauses</li>
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* WHEN */}
              {interview.interview_type_when && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">📅</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        WHEN: {interview.interview_type_when}
                      </h3>
                      <p className="text-gray-600">
                        {INTERVIEW_TYPE_DESCRIPTIONS.WHEN[interview.interview_type_when]}
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4 mt-4">
                    <div className="font-semibold text-gray-900 mb-2">Focus Areas:</div>
                    {interview.interview_type_when === 'Screening' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Duration: 20-30 minutes</li>
                        <li>Purpose: Verify resume, basic qualifications</li>
                        <li>Keep answers concise and clear</li>
                        <li>Prepare 2-minute "tell me about yourself"</li>
                      </ul>
                    )}
                    {interview.interview_type_when === 'Mid-process' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Duration: 45-60 minutes</li>
                        <li>Purpose: Deep dive into skills and experience</li>
                        <li>Prepare 3-5 detailed PAR stories</li>
                        <li>Show expertise, not just basics</li>
                      </ul>
                    )}
                    {interview.interview_type_when === 'Final' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Duration: 2-4 hours (multiple meetings)</li>
                        <li>Purpose: Final decision - "should we hire?"</li>
                        <li>Culture fit and team dynamics critical</li>
                        <li>Be ready to discuss compensation</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* HOW MANY */}
              {interview.interview_type_how_many && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">👥</div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        HOW MANY: {interview.interview_type_how_many}
                      </h3>
                      <p className="text-gray-600">
                        {INTERVIEW_TYPE_DESCRIPTIONS.HOW_MANY[interview.interview_type_how_many]}
                      </p>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4 mt-4">
                    <div className="font-semibold text-gray-900 mb-2">Strategy:</div>
                    {interview.interview_type_how_many === 'Individual' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Build personal connection</li>
                        <li>Easier to read the room and adjust</li>
                        <li>More intimate, can be conversational</li>
                      </ul>
                    )}
                    {interview.interview_type_how_many === 'Panel' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Make eye contact with all panelists</li>
                        <li>Address questioner, but glance at others</li>
                        <li>Distribute attention evenly</li>
                        <li>Take notes on who asks what</li>
                      </ul>
                    )}
                    {interview.interview_type_how_many === 'Group' && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                        <li>Show leadership without dominating</li>
                        <li>Be supportive of other candidates</li>
                        <li>They're watching team dynamics</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate(`/interview/${id}`)}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Back to Interview Preparation
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
