/**
 * OAuth Callback Handler
 * This page handles the redirect after OAuth authentication
 */

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState(t('auth.callback.processing'))

  useEffect(() => {
    handleCallback()
  }, [])

  async function handleCallback() {
    try {
      console.log('🔄 Processing OAuth callback...')

      // Get session from URL hash
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('❌ Error getting session:', error)
        setStatus('error')
        setMessage(`Authentication failed: ${error.message}`)
        return
      }

      if (session) {
        console.log('✅ Authentication successful!')
        console.log('User:', session.user)
        console.log('Provider:', session.user.app_metadata.provider)

        setStatus('success')
        setMessage(t('auth.callback.successMessage'))

        // Check if user has seen Career Vision prompt
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('has_seen_career_vision_prompt')
          .eq('user_id', session.user.id)
          .single()

        // Redirect based on Career Vision status
        setTimeout(() => {
          if (!profile || !profile.has_seen_career_vision_prompt) {
            // New user - show Career Vision welcome
            window.location.href = '/career-vision/welcome'
          } else {
            // Existing user - go to onboarding or dashboard
            window.location.href = '/onboarding'
          }
        }, 2000)
      } else {
        console.log('⚠️ No session found')
        setStatus('error')
        setMessage(t('auth.callback.noSession'))

        setTimeout(() => {
          window.location.href = '/signin'
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      setStatus('error')
      setMessage('An unexpected error occurred.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {t('auth.callback.completing')}
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="inline-block text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-success mb-2">
              {t('auth.callback.success')}
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="inline-block text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-danger mb-2">
              {t('auth.callback.failed')}
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <a
              href="/"
              className="inline-block bg-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-600"
            >
              {t('auth.callback.returnHome')}
            </a>
          </>
        )}
      </div>
    </div>
  )
}
